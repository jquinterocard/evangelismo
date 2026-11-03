-- =====================================================================
-- 0003 · Límites anti-abuso para solicitudes de contacto
-- ---------------------------------------------------------------------
-- El session_id lo elige el navegador, así que cambiarlo no debe permitir
-- agotar el cupo global y bloquear a las personas reales. Se añaden límites
-- que no dependen de la sesión:
--   * por conexión (IP): 3 por hora. Solo se guarda un hash de la IP con una
--     sal aleatoria diaria; la sal se descarta al día siguiente (el hash deja de
--     poder relacionarse con una IP) y el hash se borra a las 24 horas.
--   * por número de WhatsApp: 1 cada 24 horas (las repeticiones se tratan como
--     «duplicado» y no generan otra fila).
--   * tope global más alto (200/hora) solo como último respaldo.
-- Requiere 0001 y 0002 aplicadas. Se puede ejecutar más de una vez.
-- =====================================================================

alter table public.contact_requests add column if not exists client_key text null;

-- Sal aleatoria por día para el hash de la conexión (privada; se descarta a los 2 días).
create table if not exists public.contact_rate_salts (
  day  date primary key,
  salt text not null
);
alter table public.contact_rate_salts enable row level security;
alter table public.contact_rate_salts force row level security;
revoke all on table public.contact_rate_salts from public, anon, authenticated;

create index if not exists contact_requests_client_key_idx on public.contact_requests (client_key, created_at) where client_key is not null;
create index if not exists contact_requests_whatsapp_idx on public.contact_requests (whatsapp, created_at);

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
  v_headers  json;
  v_ip       text := '';
  v_key      text;
  v_salt     text;
  v_teaching text;
  v_id       uuid;
  v_count    int;
  c_per_ip_per_hour constant int := 3;
  c_global_per_hour constant int := 200;
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

  -- Limpieza: el hash de la conexión solo se conserva 24 horas.
  update public.contact_requests c set client_key = null
   where c.client_key is not null and c.created_at < now() - interval '24 hours';

  -- El mismo número ya pidió contacto en las últimas 24 horas: no se duplica.
  -- (No se devuelve el id de esa otra solicitud.)
  if exists (select 1 from public.contact_requests c
             where c.whatsapp = v_phone and c.created_at > now() - interval '24 hours') then
    return query select 'duplicate'::text, null::uuid;
    return;
  end if;

  -- IP del cliente: cf-connecting-ip la fija Cloudflare (delante de Supabase) y el cliente no la
  -- controla. Respaldo: el ÚLTIMO valor de x-forwarded-for (el primero lo puede inventar el cliente).
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
    v_ip := btrim(coalesce(
      nullif(v_headers ->> 'cf-connecting-ip', ''),
      (regexp_split_to_array(coalesce(v_headers ->> 'x-forwarded-for', ''), '\s*,\s*'))[
        cardinality(regexp_split_to_array(coalesce(v_headers ->> 'x-forwarded-for', ''), '\s*,\s*'))],
      ''));
  exception when others then
    v_ip := '';
  end;

  if v_ip <> '' then
    delete from public.contact_rate_salts s where s.day < current_date - 1;
    insert into public.contact_rate_salts (day, salt) values (current_date, gen_random_uuid()::text)
    on conflict (day) do nothing;
    select s.salt into v_salt from public.contact_rate_salts s where s.day = current_date;
    v_key := md5(v_salt || ':' || v_ip);
  end if;

  if v_key is not null then
    select count(*) into v_count from public.contact_requests c
     where c.client_key = v_key and c.created_at > now() - interval '1 hour';
    if v_count >= c_per_ip_per_hour then
      return query select 'rate_limited'::text, null::uuid;
      return;
    end if;
  end if;

  select count(*) into v_count from public.contact_requests c where c.created_at > now() - interval '1 hour';
  if v_count >= c_global_per_hour then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  insert into public.contact_requests
    (completion_id, teaching_id, name, whatsapp, email, preferred_contact, prayer_request, consent_at, consent_version, client_key)
  values
    (p_completion_id, v_teaching, v_name, v_phone, v_email, p_preferred, v_prayer, now(), '2026-11', v_key)
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

revoke all on function public.submit_contact_request(uuid, uuid, text, text, text, text, text, boolean) from public;
grant execute on function public.submit_contact_request(uuid, uuid, text, text, text, text, text, boolean) to anon, authenticated;
