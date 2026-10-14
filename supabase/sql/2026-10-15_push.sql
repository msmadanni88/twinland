-- ─────────────────────────────────────────────────────────────
--  TwinLand — 2026-10-15 — web push for in-app notifications
--  The VAPID key pair is created by the edge function push-send on first use and kept
--  in app_secrets, which only the service role can read. The private key never leaves
--  the server. Every new row in notifications is forwarded to push-send through pg_net,
--  only for people who turned push on.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pg_net;

create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  created_at timestamptz not null default now()
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
grant select, insert, update on public.app_secrets to service_role;

-- shared value between the database hook and the edge function, generated in place
insert into public.app_secrets (name, value)
values ('push_hook', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) < 1000),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  ua text,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz,
  fail_count integer not null default 0,
  disabled_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id) where disabled_at is null;
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, update on public.push_subscriptions to service_role;

-- the public half of the key pair, for the browser
create or replace function public.push_config() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('public_key', (select value from public.app_secrets where name = 'vapid_public'))
$$;
grant execute on function public.push_config() to anon, authenticated;

create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_ua text default null)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) >= 1000
     or char_length(coalesce(p_p256dh, '')) not between 20 and 200
     or char_length(coalesce(p_auth, '')) not between 8 and 100 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, ua)
  values (v_uid, p_endpoint, p_p256dh, p_auth, left(p_ua, 200))
  on conflict (endpoint) do update set user_id = v_uid, p256dh = excluded.p256dh, auth = excluded.auth,
    ua = excluded.ua, disabled_at = null, fail_count = 0;
  -- at most 5 live devices per person: older ones go quiet
  update public.push_subscriptions set disabled_at = now()
   where user_id = v_uid and disabled_at is null
     and id not in (select s.id from public.push_subscriptions s
                     where s.user_id = v_uid and s.disabled_at is null
                     order by s.created_at desc limit 5);
  return jsonb_build_object('ok', true);
end $function$;
revoke all on function public.push_subscribe(text, text, text, text) from public, anon;
grant execute on function public.push_subscribe(text, text, text, text) to authenticated;

create or replace function public.push_unsubscribe(p_endpoint text) returns jsonb
language plpgsql security definer set search_path = '' as $function$
begin
  update public.push_subscriptions set disabled_at = now()
   where endpoint = p_endpoint and user_id = auth.uid() and disabled_at is null;
  return jsonb_build_object('ok', true);
end $function$;
revoke all on function public.push_unsubscribe(text) from public, anon;
grant execute on function public.push_unsubscribe(text) to authenticated;

create or replace function public.tl_push_on_notification() returns trigger
language plpgsql security definer set search_path = '' as $function$
declare v_hook text;
begin
  if not exists (select 1 from public.push_subscriptions s where s.user_id = new.user_id and s.disabled_at is null) then
    return new;
  end if;
  select value into v_hook from public.app_secrets where name = 'push_hook';
  if v_hook is null then return new; end if;
  perform net.http_post(
    url := 'https://pkkdepecbzrnmejnseqg.supabase.co/functions/v1/push-send',
    body := jsonb_build_object('action', 'send', 'id', new.id, 'hook', v_hook),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 8000);
  return new;
exception when others then
  -- push must never block the in-app notification
  return new;
end $function$;
revoke all on function public.tl_push_on_notification() from public, anon, authenticated;
create trigger notifications_push after insert on public.notifications
  for each row execute function public.tl_push_on_notification();
