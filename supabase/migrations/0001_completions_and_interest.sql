-- =====================================================================
-- Un Encuentro con Jesús — registro global de finalizaciones e interés
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run.
-- Después ejecutar supabase/seed_teachings.sql (generado con `npm run gen:sql`).
--
-- Principios:
--  * El navegador (rol anon) NO tiene acceso a ninguna tabla: RLS activado,
--    sin políticas y con privilegios revocados.
--  * Solo puede invocar funciones RPC SECURITY DEFINER que validan cada
--    solicitud, evitan duplicados y limitan la tasa de eventos.
--  * No existen contadores almacenados: los agregados se calculan desde los
--    eventos, por lo que el navegador no puede alterarlos.
--  * No se guardan nombres, correos, teléfonos, IP ni identificadores
--    persistentes. session_id es un UUID aleatorio de sessionStorage.
-- =====================================================================

-- gen_random_uuid() es nativa desde PostgreSQL 13 (Supabase la incluye).

-- ---------------------------------------------------------------------
-- Catálogo de enseñanzas válidas (solo ids, para validar solicitudes)
-- ---------------------------------------------------------------------
create table if not exists public.teachings (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  active boolean not null default true
);

-- ---------------------------------------------------------------------
-- Eventos de finalización
-- ---------------------------------------------------------------------
create table if not exists public.completion_events (
  id uuid primary key default gen_random_uuid(),            -- identificador aleatorio del evento
  qr_id uuid null,                                          -- QR desde el que se abrió (si existe)
  teaching_id text not null references public.teachings (id),
  session_id uuid not null,                                 -- aleatorio, NO identifica personas
  completed_at timestamptz not null default now(),          -- hora del servidor
  validation_status text not null default 'accepted'
    check (validation_status in ('accepted', 'rate_limited'))
);

-- Un mismo navegador/sesión solo puede completar una vez cada enseñanza desde cada QR.
create unique index if not exists completion_events_unique_accepted
  on public.completion_events (session_id, teaching_id, (coalesce(qr_id, '00000000-0000-0000-0000-000000000000'::uuid)))
  where validation_status = 'accepted';

create index if not exists completion_events_completed_at_idx on public.completion_events (completed_at);
create index if not exists completion_events_session_idx on public.completion_events (session_id, completed_at);
create index if not exists completion_events_qr_idx on public.completion_events (qr_id, completed_at) where qr_id is not null;

-- ---------------------------------------------------------------------
-- Respuestas voluntarias de interés (una por finalización)
-- ---------------------------------------------------------------------
create table if not exists public.interest_responses (
  completion_id uuid primary key references public.completion_events (id) on delete cascade,
  response text not null check (response in ('positive', 'negative', 'skipped')),
  responded_at timestamptz not null default now()
);

create index if not exists interest_responses_responded_at_idx on public.interest_responses (responded_at);

-- ---------------------------------------------------------------------
-- Seguridad: RLS sin políticas + privilegios revocados
-- ---------------------------------------------------------------------
alter table public.teachings enable row level security;
alter table public.completion_events enable row level security;
alter table public.interest_responses enable row level security;

alter table public.teachings force row level security;
alter table public.completion_events force row level security;
alter table public.interest_responses force row level security;

revoke all on table public.teachings from public, anon, authenticated;
revoke all on table public.completion_events from public, anon, authenticated;
revoke all on table public.interest_responses from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- RPC: registrar una finalización
-- Devuelve: status ('registered' | 'duplicate' | 'rate_limited' | 'invalid'),
--           completion_id, response (respuesta ya guardada si es duplicado)
-- ---------------------------------------------------------------------
create or replace function public.register_completion(
  p_teaching_id text,
  p_session_id uuid,
  p_qr_id uuid default null
)
returns table (status text, completion_id uuid, response text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_session_hour   int;
  v_session_tries  int;
  v_qr_minute      int;
  v_global_minute  int;
  v_id             uuid;
  -- Límites contra abuso (ajustables)
  c_session_accepted_per_hour constant int := 30;
  c_session_attempts_per_hour constant int := 60;
  c_qr_per_minute             constant int := 120;
  c_global_per_minute         constant int := 600;
begin
  if p_teaching_id is null or p_session_id is null
     or p_teaching_id !~ '^[a-z0-9-]{1,80}$'
     or not exists (select 1 from public.teachings t where t.id = p_teaching_id and t.active) then
    return query select 'invalid'::text, null::uuid, null::text;
    return;
  end if;

  -- ¿Ya existe? (idempotente: devuelve el mismo evento y su respuesta)
  select e.id into v_id
  from public.completion_events e
  where e.session_id = p_session_id
    and e.teaching_id = p_teaching_id
    and coalesce(e.qr_id, '00000000-0000-0000-0000-000000000000'::uuid)
        = coalesce(p_qr_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and e.validation_status = 'accepted'
  limit 1;

  if v_id is not null then
    return query
      select 'duplicate'::text, v_id, (select r.response from public.interest_responses r where r.completion_id = v_id);
    return;
  end if;

  -- Protección global del plan gratuito
  select count(*) into v_global_minute
  from public.completion_events e
  where e.completed_at > now() - interval '1 minute';
  if v_global_minute >= c_global_per_minute then
    return query select 'rate_limited'::text, null::uuid, null::text;
    return;
  end if;

  select count(*) filter (where e.validation_status = 'accepted'), count(*)
    into v_session_hour, v_session_tries
  from public.completion_events e
  where e.session_id = p_session_id
    and e.completed_at > now() - interval '1 hour';

  if p_qr_id is not null then
    select count(*) into v_qr_minute
    from public.completion_events e
    where e.qr_id = p_qr_id and e.completed_at > now() - interval '1 minute';
  else
    v_qr_minute := 0;
  end if;

  if v_session_hour >= c_session_accepted_per_hour or v_qr_minute >= c_qr_per_minute then
    -- Se deja constancia del intento rechazado, con un tope para no llenar la base.
    if v_session_tries < c_session_attempts_per_hour then
      insert into public.completion_events (qr_id, teaching_id, session_id, validation_status)
      values (p_qr_id, p_teaching_id, p_session_id, 'rate_limited');
    end if;
    return query select 'rate_limited'::text, null::uuid, null::text;
    return;
  end if;

  insert into public.completion_events (qr_id, teaching_id, session_id, validation_status)
  values (p_qr_id, p_teaching_id, p_session_id, 'accepted')
  on conflict (session_id, teaching_id, (coalesce(qr_id, '00000000-0000-0000-0000-000000000000'::uuid)))
    where validation_status = 'accepted'
  do nothing
  returning id into v_id;

  if v_id is null then
    -- Carrera con una solicitud simultánea idéntica.
    select e.id into v_id
    from public.completion_events e
    where e.session_id = p_session_id
      and e.teaching_id = p_teaching_id
      and coalesce(e.qr_id, '00000000-0000-0000-0000-000000000000'::uuid)
          = coalesce(p_qr_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and e.validation_status = 'accepted'
    limit 1;
    return query
      select 'duplicate'::text, v_id, (select r.response from public.interest_responses r where r.completion_id = v_id);
    return;
  end if;

  return query select 'registered'::text, v_id, null::text;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: registrar la respuesta voluntaria de interés
-- Requiere conocer el completion_id aleatorio Y el session_id que lo creó,
-- y que la finalización tenga menos de 24 horas.
-- Devuelve: status ('registered' | 'duplicate' | 'invalid'), response
-- ---------------------------------------------------------------------
create or replace function public.register_interest(
  p_completion_id uuid,
  p_session_id uuid,
  p_response text
)
returns table (status text, response text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_inserted uuid;
begin
  if p_completion_id is null or p_session_id is null
     or p_response is null or p_response not in ('positive', 'negative', 'skipped') then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  if not exists (
    select 1 from public.completion_events e
    where e.id = p_completion_id
      and e.session_id = p_session_id
      and e.validation_status = 'accepted'
      and e.completed_at > now() - interval '24 hours'
  ) then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  insert into public.interest_responses (completion_id, response)
  values (p_completion_id, p_response)
  on conflict (completion_id) do nothing
  returning completion_id into v_inserted;

  if v_inserted is null then
    return query
      select 'duplicate'::text, r.response from public.interest_responses r where r.completion_id = p_completion_id;
    return;
  end if;

  return query select 'registered'::text, p_response;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC de solo lectura: estadísticas diarias agregadas
-- ---------------------------------------------------------------------
create or replace function public.impact_daily_stats(
  p_from date,
  p_to date,
  p_tz text default 'UTC'
)
returns table (day date, completions bigint, positive bigint, negative bigint, skipped bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_tz text := 'UTC';
begin
  if p_from is null or p_to is null or p_to < p_from or (p_to - p_from) > 400 then
    raise exception 'Rango de fechas inválido (máximo 400 días)';
  end if;
  if p_tz is not null and exists (select 1 from pg_timezone_names z where z.name = p_tz) then
    v_tz := p_tz;
  end if;

  return query
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  ),
  c as (
    select (e.completed_at at time zone v_tz)::date as d, count(*) as n
    from public.completion_events e
    where e.validation_status = 'accepted'
      and e.completed_at >= (p_from::timestamp at time zone v_tz)
      and e.completed_at < ((p_to + 1)::timestamp at time zone v_tz)
    group by 1
  ),
  r as (
    select (ir.responded_at at time zone v_tz)::date as d,
           count(*) filter (where ir.response = 'positive') as pos,
           count(*) filter (where ir.response = 'negative') as neg,
           count(*) filter (where ir.response = 'skipped') as skp
    from public.interest_responses ir
    where ir.responded_at >= (p_from::timestamp at time zone v_tz)
      and ir.responded_at < ((p_to + 1)::timestamp at time zone v_tz)
    group by 1
  )
  select days.d,
         coalesce(c.n, 0)::bigint,
         coalesce(r.pos, 0)::bigint,
         coalesce(r.neg, 0)::bigint,
         coalesce(r.skp, 0)::bigint
  from days
  left join c on c.d = days.d
  left join r on r.d = days.d
  order by days.d;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC de solo lectura: enseñanzas más completadas
-- ---------------------------------------------------------------------
create or replace function public.top_completed_teachings(
  p_from date,
  p_to date,
  p_tz text default 'UTC',
  p_limit int default 10
)
returns table (teaching_id text, completions bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_tz text := 'UTC';
begin
  if p_from is null or p_to is null or p_to < p_from or (p_to - p_from) > 400 then
    raise exception 'Rango de fechas inválido (máximo 400 días)';
  end if;
  if p_tz is not null and exists (select 1 from pg_timezone_names z where z.name = p_tz) then
    v_tz := p_tz;
  end if;

  return query
  select e.teaching_id, count(*)::bigint
  from public.completion_events e
  where e.validation_status = 'accepted'
    and e.completed_at >= (p_from::timestamp at time zone v_tz)
    and e.completed_at < ((p_to + 1)::timestamp at time zone v_tz)
  group by e.teaching_id
  order by 2 desc, 1
  limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos de ejecución: solo las RPC, nada más
-- ---------------------------------------------------------------------
revoke all on function public.register_completion(text, uuid, uuid) from public;
revoke all on function public.register_interest(uuid, uuid, text) from public;
revoke all on function public.impact_daily_stats(date, date, text) from public;
revoke all on function public.top_completed_teachings(date, date, text, int) from public;

grant execute on function public.register_completion(text, uuid, uuid) to anon, authenticated;
grant execute on function public.register_interest(uuid, uuid, text) to anon, authenticated;
grant execute on function public.impact_daily_stats(date, date, text) to anon, authenticated;
grant execute on function public.top_completed_teachings(date, date, text, int) to anon, authenticated;
