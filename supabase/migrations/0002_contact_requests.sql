-- =====================================================================
-- 0002 · Solicitudes de contacto (seguimiento) y panel de mentores
-- ---------------------------------------------------------------------
-- Quien responde «Sí, quiero aprender más» puede pedir, de forma VOLUNTARIA
-- y con autorización expresa (Ley 1581 de 2012), que un mentor lo contacte.
-- Mismo patrón que 0001: RLS forzado sin políticas, privilegios revocados y
-- acceso solo mediante funciones SECURITY DEFINER con search_path fijo.
-- Requiere 0001 aplicada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Mentores autorizados (los administra el dueño del proyecto en Supabase).
-- Además deben existir como usuarios en Auth (invitados; sin registro público).
-- ---------------------------------------------------------------------
create table if not exists public.mentors (
  email  text primary key check (email = lower(email) and length(email) between 3 and 120),
  name   text null check (name is null or length(name) <= 80),
  active boolean not null default true
);

-- ---------------------------------------------------------------------
-- Solicitudes de contacto
-- ---------------------------------------------------------------------
create table if not exists public.contact_requests (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  completion_id     uuid null unique references public.completion_events (id) on delete set null,
  teaching_id       text null,
  name              text not null check (length(name) between 2 and 80),
  whatsapp          text not null check (whatsapp ~ '^[0-9]{8,15}$'),
  email             text null check (email is null or (length(email) <= 120 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  preferred_contact text not null check (preferred_contact in ('whatsapp', 'llamada', 'reunion')),
  prayer_request    text null check (prayer_request is null or length(prayer_request) <= 1000),
  consent_at        timestamptz not null,
  consent_version   text not null check (length(consent_version) <= 20),
  status            text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'acompanamiento', 'cerrado')),
  notes             text null check (notes is null or length(notes) <= 2000),
  updated_at        timestamptz null,
  updated_by        text null
);

create index if not exists contact_requests_created_at_idx on public.contact_requests (created_at desc);
create index if not exists contact_requests_status_idx on public.contact_requests (status, created_at desc);

alter table public.mentors enable row level security;
alter table public.contact_requests enable row level security;
alter table public.mentors force row level security;
alter table public.contact_requests force row level security;

revoke all on table public.mentors from public, anon, authenticated;
revoke all on table public.contact_requests from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- RPC pública: enviar una solicitud de contacto
-- Exige: autorización expresa, una finalización aceptada de la MISMA sesión
-- con menos de 24 horas y respuesta «Sí». Una solicitud por finalización.
-- Devuelve: status ('registered' | 'duplicate' | 'invalid' | 'rate_limited'), request_id
-- ---------------------------------------------------------------------
create or replace function public.submit_contact_request(
  p_completion_id uuid,
  p_session_id uuid,
  p_name text,
  p_whatsapp text,
  p_email text,
  p_preferred text,
  p_prayer text,
  p_consent boolean
)
returns table (status text, request_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_name     text := btrim(coalesce(p_name, ''));
  v_phone    text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  v_email    text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_prayer   text := nullif(btrim(coalesce(p_prayer, '')), '');
  v_teaching text;
  v_id       uuid;
  v_hour     int;
  c_global_per_hour constant int := 60;
begin
  if p_completion_id is null or p_session_id is null or p_consent is distinct from true
     or length(v_name) not between 2 and 80 or v_name ~ '[[:cntrl:]]'
     or v_phone !~ '^[0-9]{8,15}$'
     or (v_email is not null and (length(v_email) > 120 or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'))
     or p_preferred is null or p_preferred not in ('whatsapp', 'llamada', 'reunion')
     or (v_prayer is not null and length(v_prayer) > 1000) then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;

  select e.teaching_id into v_teaching
  from public.completion_events e
  join public.interest_responses r on r.completion_id = e.id and r.response = 'positive'
  where e.id = p_completion_id
    and e.session_id = p_session_id
    and e.validation_status = 'accepted'
    and e.completed_at > now() - interval '24 hours';

  if v_teaching is null then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;

  select c.id into v_id from public.contact_requests c where c.completion_id = p_completion_id;
  if v_id is not null then
    return query select 'duplicate'::text, v_id;
    return;
  end if;

  select count(*) into v_hour from public.contact_requests c where c.created_at > now() - interval '1 hour';
  if v_hour >= c_global_per_hour then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  insert into public.contact_requests
    (completion_id, teaching_id, name, whatsapp, email, preferred_contact, prayer_request, consent_at, consent_version)
  values
    (p_completion_id, v_teaching, v_name, v_phone, v_email, p_preferred, v_prayer, now(), '2026-11')
  on conflict (completion_id) do nothing
  returning id into v_id;

  if v_id is null then
    select c.id into v_id from public.contact_requests c where c.completion_id = p_completion_id;
    return query select 'duplicate'::text, v_id;
    return;
  end if;

  return query select 'registered'::text, v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- ¿El usuario autenticado es un mentor activo? (correo del JWT de Supabase Auth)
-- ---------------------------------------------------------------------
create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.mentors m
    where m.active and m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
-- RPC de mentores: listar solicitudes (más recientes primero)
-- ---------------------------------------------------------------------
create or replace function public.mentor_list_requests(p_status text default null)
returns table (
  id uuid,
  created_at timestamptz,
  teaching_id text,
  name text,
  whatsapp text,
  email text,
  preferred_contact text,
  prayer_request text,
  status text,
  notes text,
  updated_at timestamptz,
  updated_by text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.is_mentor() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  return query
  select c.id, c.created_at, c.teaching_id, c.name, c.whatsapp, c.email, c.preferred_contact,
         c.prayer_request, c.status, c.notes, c.updated_at, c.updated_by
  from public.contact_requests c
  where p_status is null or c.status = p_status
  order by c.created_at desc
  limit 500;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC de mentores: actualizar estado y notas
-- Devuelve: status ('updated' | 'not_found' | 'invalid')
-- ---------------------------------------------------------------------
create or replace function public.mentor_update_request(p_id uuid, p_status text, p_notes text)
returns table (status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  if not public.is_mentor() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_id is null or p_status is null or p_status not in ('nuevo', 'contactado', 'acompanamiento', 'cerrado')
     or (v_notes is not null and length(v_notes) > 2000) then
    return query select 'invalid'::text;
    return;
  end if;
  update public.contact_requests c
     set status = p_status, notes = v_notes, updated_at = now(), updated_by = lower(auth.jwt() ->> 'email')
   where c.id = p_id;
  if not found then
    return query select 'not_found'::text;
    return;
  end if;
  return query select 'updated'::text;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC de mentores: eliminar una solicitud (derecho de supresión)
-- Devuelve: status ('deleted' | 'not_found')
-- ---------------------------------------------------------------------
create or replace function public.mentor_delete_request(p_id uuid)
returns table (status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.is_mentor() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  delete from public.contact_requests c where c.id = p_id;
  if not found then
    return query select 'not_found'::text;
    return;
  end if;
  return query select 'deleted'::text;
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke all on function public.submit_contact_request(uuid, uuid, text, text, text, text, text, boolean) from public;
revoke all on function public.is_mentor() from public;
revoke all on function public.mentor_list_requests(text) from public;
revoke all on function public.mentor_update_request(uuid, text, text) from public;
revoke all on function public.mentor_delete_request(uuid) from public;

grant execute on function public.submit_contact_request(uuid, uuid, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.is_mentor() to authenticated;
grant execute on function public.mentor_list_requests(text) to authenticated;
grant execute on function public.mentor_update_request(uuid, text, text) to authenticated;
grant execute on function public.mentor_delete_request(uuid) to authenticated;
