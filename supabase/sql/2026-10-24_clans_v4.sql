-- ─────────────────────────────────────────────────────────────
--  کلن نسخه تازه — 2026-10-24
--  طرح و شواهد: سند claude/TwinLand_Clan_Design.md در پروژه
--
--  بخش 1: ستون‌ها و جدول‌های تازه
--  بخش 2: تابع‌های کمکی داخلی
--  بخش 3: خواندن: clan_home، clan_view، clan_browse، clan_districts، cafe_clan_info
--  بخش 4: نوشتن: ساختن، ویرایش، پیوستن، درخواست، ترک، نقش، انتقال، انحلال، کد، دورهمی، تابلو
--  بخش 5: تریگر چک‌این: امتیاز کلن، صندوق هفته، سطح، دورهمی
--  بخش 6: سازگاری نسخه‌های قبل و بستن نشت‌ها
--
--  قاعده‌ها:
--   - هر نفر فقط یک کلن. امتیاز کلن فقط از چک‌این‌های بعد از پیوستن
--   - کد دعوت در جدول جدا و فقط برای اعضا؛ ستون قدیمی join_code دیگر پر نمی‌شود
--   - همه تابع‌ها با دسترسی سازنده و فقط برای کاربر واردشده؛ جدول‌ها مستقیم نوشته نمی‌شوند
-- ─────────────────────────────────────────────────────────────

-- ═════════ بخش 1: ستون‌ها و جدول‌ها ═════════

alter table public.clans add column if not exists join_mode text not null default 'open';
alter table public.clans add column if not exists min_level integer not null default 1;
alter table public.clans add column if not exists home_cafe_id uuid references public.cafes(id) on delete set null;
alter table public.clans add column if not exists points bigint not null default 0;
alter table public.clans add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.clans add column if not exists disbanded_at timestamptz;
alter table public.clans add column if not exists updated_at timestamptz not null default now();
alter table public.clans alter column join_code drop not null;
alter table public.clans alter column join_code drop default;
update public.clans set join_code = null where join_code is not null;
alter table public.clans alter column emblem set default 'flame';
alter table public.clans alter column color set default '#8B5CF6';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'clans_join_mode_chk') then
    alter table public.clans add constraint clans_join_mode_chk check (join_mode in ('open', 'request', 'invite'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clans_min_level_chk') then
    alter table public.clans add constraint clans_min_level_chk check (min_level between 1 and 10);
  end if;
end $$;

-- هر نفر یک ردیف عضویت؛ ترک کردن ردیف را حذف نمی‌کند و فقط is_active خاموش می‌شود
create unique index if not exists clan_members_one_clan on public.clan_members (user_id);
create unique index if not exists clans_name_live on public.clans (lower(name)) where disbanded_at is null;

create table if not exists public.clan_codes (
  clan_id bigint primary key references public.clans(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.clan_requests (
  id bigserial primary key,
  clan_id bigint not null references public.clans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz
);
create unique index if not exists clan_requests_one_pending on public.clan_requests (clan_id, user_id) where status = 'pending';
create index if not exists clan_requests_user on public.clan_requests (user_id, status);

create table if not exists public.clan_contrib (
  id bigserial primary key,
  clan_id bigint not null references public.clans(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('checkin', 'meetup')),
  points integer not null default 0,
  checkin_id uuid,
  cafe_id uuid,
  district text,
  week_start date not null,
  created_at timestamptz not null default now()
);
create unique index if not exists clan_contrib_checkin on public.clan_contrib (checkin_id) where checkin_id is not null;
create index if not exists clan_contrib_week on public.clan_contrib (clan_id, week_start);
create index if not exists clan_contrib_user on public.clan_contrib (user_id, week_start);
create index if not exists clan_contrib_month on public.clan_contrib (created_at, district);

create table if not exists public.clan_week_tiers (
  clan_id bigint not null references public.clans(id) on delete cascade,
  week_start date not null,
  tier smallint not null,
  reached_at timestamptz not null default now(),
  primary key (clan_id, week_start, tier)
);

create table if not exists public.clan_week_rewards (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  tier smallint not null,
  clan_id bigint,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start, tier)
);

create table if not exists public.clan_meetups (
  id bigserial primary key,
  clan_id bigint not null references public.clans(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  starts_at timestamptz not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists clan_meetups_clan on public.clan_meetups (clan_id, starts_at);
create index if not exists clan_meetups_cafe on public.clan_meetups (cafe_id, starts_at);

create table if not exists public.clan_meetup_rsvps (
  meetup_id bigint not null references public.clan_meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);
alter table public.clan_meetup_rsvps add column if not exists going boolean not null default true;
alter table public.clan_members add column if not exists left_at timestamptz;

create table if not exists public.clan_meetup_rewards (
  meetup_id bigint not null references public.clan_meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_day date not null,
  created_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);
create unique index if not exists clan_meetup_rewards_day on public.clan_meetup_rewards (user_id, reward_day);

create table if not exists public.clan_posts (
  id bigserial primary key,
  clan_id bigint not null references public.clans(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  hidden boolean not null default false,
  reports integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists clan_posts_clan on public.clan_posts (clan_id, created_at desc);

create table if not exists public.clan_post_reports (
  post_id bigint not null references public.clan_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.clan_events (
  id bigserial primary key,
  clan_id bigint not null references public.clans(id) on delete cascade,
  kind text not null,
  actor uuid references public.profiles(id) on delete set null,
  target uuid references public.profiles(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists clan_events_clan on public.clan_events (clan_id, created_at desc);

create table if not exists public.clan_cooldowns (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  until timestamptz not null
);

-- قفل ردیف‌ها: جدول‌های تازه فقط از تابع‌ها نوشته می‌شوند
alter table public.clan_codes enable row level security;
alter table public.clan_requests enable row level security;
alter table public.clan_contrib enable row level security;
alter table public.clan_week_tiers enable row level security;
alter table public.clan_week_rewards enable row level security;
alter table public.clan_meetups enable row level security;
alter table public.clan_meetup_rsvps enable row level security;
alter table public.clan_meetup_rewards enable row level security;
alter table public.clan_posts enable row level security;
alter table public.clan_post_reports enable row level security;
alter table public.clan_events enable row level security;
alter table public.clan_cooldowns enable row level security;

revoke all on public.clan_codes, public.clan_requests, public.clan_contrib, public.clan_week_tiers, public.clan_week_rewards,
  public.clan_meetups, public.clan_meetup_rsvps, public.clan_meetup_rewards, public.clan_posts, public.clan_post_reports,
  public.clan_events, public.clan_cooldowns from anon, authenticated;

-- ═════════ بخش 2: تابع‌های کمکی ═════════

create or replace function public.tl_my_clan_id()
returns bigint language sql stable security definer set search_path to ''
as $$ select m.clan_id from public.clan_members m where m.user_id = auth.uid() and m.is_active limit 1 $$;

create or replace function public.tl_clan_role_of(p_clan bigint, p_user uuid)
returns text language sql stable security definer set search_path to ''
as $$ select m.role from public.clan_members m where m.clan_id = p_clan and m.user_id = p_user and m.is_active $$;

create or replace function public.tl_is_business(p_user uuid)
returns boolean language sql stable security definer set search_path to ''
as $$ select exists (select 1 from public.profiles p where p.id = p_user and p.account_type = 'sme') and p_user is distinct from public.tl_owner_id() $$;

create or replace function public.tl_clan_level(p bigint)
returns integer language sql immutable set search_path to ''
as $$ select case when coalesce(p, 0) >= 23000 then 10 when p >= 17000 then 9 when p >= 12000 then 8 when p >= 8000 then 7
  when p >= 5000 then 6 when p >= 3000 then 5 when p >= 1600 then 4 when p >= 800 then 3 when p >= 300 then 2 else 1 end $$;

create or replace function public.tl_clan_level_min(p_level integer)
returns bigint language sql immutable set search_path to ''
as $$ select (array[0, 300, 800, 1600, 3000, 5000, 8000, 12000, 17000, 23000])[greatest(1, least(10, p_level))]::bigint $$;

create or replace function public.tl_clan_cap(p_level integer)
returns integer language sql immutable set search_path to ''
as $$ select case when p_level >= 7 then 30 when p_level >= 5 then 25 when p_level >= 3 then 20 else 15 end $$;

create or replace function public.tl_clan_meetup_cap(p_level integer)
returns integer language sql immutable set search_path to ''
as $$ select case when p_level >= 4 then 2 else 1 end $$;

create or replace function public.tl_clan_tier_need(p_members integer, p_tier integer)
returns integer language sql immutable set search_path to ''
as $$ select case p_tier when 1 then greatest(3, p_members) when 2 then greatest(6, ceil(p_members * 2.5)::integer) else greatest(10, p_members * 5) end $$;

create or replace function public.tl_clan_tier_xp(p_tier integer)
returns integer language sql immutable set search_path to ''
as $$ select (array[20, 40, 80])[greatest(1, least(3, p_tier))] $$;

-- متن کاربر: پیوند، آیدی و شماره تلفن پذیرفته نیست
create or replace function public.tl_text_has_contact(p text)
returns boolean language sql immutable set search_path to ''
as $$ select coalesce(p, '') ~* '(https?:|www\.|t\.me/|@[a-z0-9_]{3,}|\.(com|ir|net|org|me|co|io)([^a-z]|$))'
  or regexp_replace(translate(coalesce(p, ''), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'), '[\s\-\.\+]', '', 'g') ~ '[0-9]{8,}' $$;

create or replace function public.tl_clan_new_code()
returns text language sql volatile set search_path to ''
as $$ select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::integer, 1), '') from generate_series(1, 6) $$;

create or replace function public.tl_clan_week_points(p_clan bigint, p_week date)
returns bigint language sql stable security definer set search_path to ''
as $$ select coalesce(sum(k.points), 0)::bigint from public.clan_contrib k where k.clan_id = p_clan and k.week_start = p_week $$;

create or replace function public.tl_clan_card(p_clan bigint)
returns jsonb language sql stable security definer set search_path to ''
as $$
  select case when c.id is null then null else jsonb_build_object(
    'id', c.id, 'name', c.name, 'emblem', c.emblem, 'color', c.color, 'motto', c.bio,
    'level', public.tl_clan_level(c.points), 'points', c.points,
    'level_min', public.tl_clan_level_min(public.tl_clan_level(c.points)),
    'level_next', case when public.tl_clan_level(c.points) < 10 then public.tl_clan_level_min(public.tl_clan_level(c.points) + 1) end,
    'week', public.tl_clan_week_points(c.id, public.tl_week_start(now())),
    'members', (select count(*) from public.clan_members m where m.clan_id = c.id and m.is_active),
    'cap', public.tl_clan_cap(public.tl_clan_level(c.points)),
    'join_mode', c.join_mode, 'min_level', c.min_level, 'created_at', c.created_at,
    'home', (select jsonb_build_object('id', h.id, 'name', h.name, 'district', h.district) from public.cafes h where h.id = c.home_cafe_id)) end
  from (select p_clan as id) x left join public.clans c on c.id = x.id and c.disbanded_at is null
$$;

create or replace function public.tl_clan_week_rank(p_clan bigint)
returns integer language sql stable security definer set search_path to ''
as $$
  with w as (
    select c.id, coalesce(sum(k.points), 0) pts from public.clans c
      left join public.clan_contrib k on k.clan_id = c.id and k.week_start = public.tl_week_start(now())
     where c.disbanded_at is null group by c.id)
  select (count(*) + 1)::integer from w where w.pts > coalesce((select pts from w where id = p_clan), 0)
$$;

create or replace function public.tl_clan_event(p_clan bigint, p_kind text, p_actor uuid, p_target uuid, p_data jsonb default '{}'::jsonb)
returns void language sql security definer set search_path to ''
as $$ insert into public.clan_events (clan_id, kind, actor, target, data) values (p_clan, p_kind, p_actor, p_target, coalesce(p_data, '{}'::jsonb)) $$;

create or replace function public.tl_clan_notify(p_clan bigint, p_type text, p_title text, p_body text, p_link text, p_except uuid default null, p_roles text[] default null)
returns void language plpgsql security definer set search_path to ''
as $$
declare m record;
begin
  for m in select user_id from public.clan_members where clan_id = p_clan and is_active and user_id is distinct from p_except
            and (p_roles is null or role = any (p_roles)) loop
    perform public.push_notification(m.user_id, p_type, p_title, p_body, '👥', coalesce(p_link, '/clan'));
  end loop;
end $$;

create or replace function public.tl_clan_set_code(p_clan bigint)
returns text language plpgsql security definer set search_path to ''
as $$
declare v_code text; v_try integer := 0;
begin
  loop
    v_try := v_try + 1;
    v_code := public.tl_clan_new_code();
    begin
      insert into public.clan_codes (clan_id, code) values (p_clan, v_code)
      on conflict (clan_id) do update set code = excluded.code, created_at = now();
      return v_code;
    exception when unique_violation then
      if v_try > 8 then raise; end if;
    end;
  end loop;
end $$;

-- عضو کردن: هر نفر یک ردیف دارد؛ پیوستن دوباره همان ردیف را به کلن تازه می‌برد
create or replace function public.tl_clan_member_set(p_clan bigint, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_ins boolean; v_name text;
begin
  insert into public.clan_members (clan_id, user_id, role, is_active, joined_at, left_at)
  values (p_clan, p_user, p_role, true, now(), null)
  on conflict (user_id) do update set clan_id = excluded.clan_id, role = excluded.role, is_active = true, joined_at = now(), left_at = null
  returning (xmax = 0) into v_ins;
  if not v_ins then
    select name into v_name from public.clans where id = p_clan;
    insert into public.clan_history (user_id, clan_id, clan_name, event_type, detail)
    values (p_user, p_clan, v_name, case when p_role = 'leader' then 'created' else 'joined' end,
            case when p_role = 'leader' then 'کلن رو ساختی' else 'عضو کلن شدی' end);
  end if;
end $$;

-- ترک کردن: ردیف می‌ماند، فقط غیرفعال می‌شود؛ «میام» دورهمی‌های باز هم برداشته می‌شود
create or replace function public.tl_clan_member_leave(p_clan bigint, p_user uuid)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_name text;
begin
  update public.clan_members set is_active = false, left_at = now(), role = 'member'
   where clan_id = p_clan and user_id = p_user and is_active;
  if found then
    select name into v_name from public.clans where id = p_clan;
    insert into public.clan_history (user_id, clan_id, clan_name, event_type, detail) values (p_user, p_clan, v_name, 'left', 'کلن رو ترک کردی');
    update public.clan_meetup_rsvps rv set going = false from public.clan_meetups mu
     where rv.meetup_id = mu.id and mu.clan_id = p_clan and rv.user_id = p_user and mu.status = 'open';
  end if;
end $$;

-- رهبر غایب: اگر 30 روز چک‌این نداشت، رهبری به فعال‌ترین معاون یا عضو می‌رسد
create or replace function public.tl_clan_maintain(p_clan bigint)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_leader uuid; v_joined timestamptz; v_last date; v_next uuid; v_name text;
begin
  select c.leader_id into v_leader from public.clans c where c.id = p_clan and c.disbanded_at is null;
  if v_leader is null then return; end if;
  select m.joined_at into v_joined from public.clan_members m where m.clan_id = p_clan and m.user_id = v_leader and m.is_active;
  select p.last_checkin_date into v_last from public.profiles p where p.id = v_leader;
  if v_joined is null or v_joined > now() - interval '30 days' then return; end if;
  if coalesce(v_last, v_joined::date) >= current_date - 30 then return; end if;
  select m.user_id into v_next from public.clan_members m join public.profiles p on p.id = m.user_id
   where m.clan_id = p_clan and m.is_active and m.user_id <> v_leader and p.last_checkin_date >= current_date - 14
   order by (m.role = 'officer') desc, p.last_checkin_date desc, m.joined_at limit 1;
  if v_next is null then return; end if;
  update public.clan_members set role = 'officer' where clan_id = p_clan and user_id = v_leader;
  update public.clan_members set role = 'leader' where clan_id = p_clan and user_id = v_next;
  update public.clans set leader_id = v_next, updated_at = now() where id = p_clan;
  select name into v_name from public.clans where id = p_clan;
  perform public.tl_clan_event(p_clan, 'leader_auto', v_leader, v_next, '{}'::jsonb);
  perform public.push_notification(v_next, 'clan_leader', 'رهبر کلن شدی', 'رهبر قبلی «' || v_name || '» بیش از 30 روز فعال نبود و رهبری به تو رسید.', '👑', '/clan');
  perform public.push_notification(v_leader, 'clan_leader', 'رهبری کلن منتقل شد', 'چون بیش از 30 روز چک‌این نداشتی، رهبری «' || v_name || '» به فعال‌ترین عضو رسید.', '👥', '/clan');
end $$;

revoke all on function public.tl_my_clan_id(), public.tl_clan_role_of(bigint, uuid), public.tl_is_business(uuid),
  public.tl_clan_week_points(bigint, date), public.tl_clan_card(bigint), public.tl_clan_week_rank(bigint),
  public.tl_clan_event(bigint, text, uuid, uuid, jsonb), public.tl_clan_notify(bigint, text, text, text, text, uuid, text[]),
  public.tl_clan_set_code(bigint), public.tl_clan_maintain(bigint), public.tl_clan_new_code(), public.tl_text_has_contact(text),
  public.tl_clan_member_set(bigint, uuid, text), public.tl_clan_member_leave(bigint, uuid)
  from public, anon, authenticated;
-- قفل ردیف‌ها به tl_my_clan_id نیاز دارد
grant execute on function public.tl_my_clan_id() to authenticated;

-- خواندن لحظه‌ای فقط برای اعضای همان کلن
create policy clan_posts_member_read on public.clan_posts for select to authenticated using (clan_id = public.tl_my_clan_id() and not hidden);
create policy clan_events_member_read on public.clan_events for select to authenticated using (clan_id = public.tl_my_clan_id());
create policy clan_meetups_member_read on public.clan_meetups for select to authenticated using (clan_id = public.tl_my_clan_id());
create policy clan_rsvps_member_read on public.clan_meetup_rsvps for select to authenticated
  using (exists (select 1 from public.clan_meetups mu where mu.id = meetup_id and mu.clan_id = public.tl_my_clan_id()));
grant select on public.clan_posts, public.clan_events, public.clan_meetups, public.clan_meetup_rsvps to authenticated;

-- ═════════ بخش 3: خواندن ═════════

-- همه چیز کلن خودم برای صفحه کلن و زبانه پنل
create or replace function public.clan_home()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare
  v_uid uuid := auth.uid(); v_clan bigint; v_role text; v_week date := public.tl_week_start(now());
  v_n integer; v_cnt integer; v_month timestamptz; c public.clans;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select m.clan_id into v_clan from public.clan_members m where m.user_id = v_uid and m.is_active;
  if v_clan is null then
    return jsonb_build_object('ok', true, 'clan', null,
      'business', public.tl_is_business(v_uid),
      'requests', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'clan', public.tl_clan_card(r.clan_id), 'at', r.created_at) order by r.created_at desc), '[]'::jsonb)
                     from public.clan_requests r where r.user_id = v_uid and r.status = 'pending'),
      'cooldown_until', (select cd.until from public.clan_cooldowns cd where cd.user_id = v_uid and cd.until > now()),
      'create_after', (select max(k.created_at) + interval '7 days' from public.clans k where k.created_by = v_uid having max(k.created_at) + interval '7 days' > now()),
      'level', (select coalesce(p.level, 1) from public.profiles p where p.id = v_uid));
  end if;

  perform public.tl_clan_maintain(v_clan);
  select m.role into v_role from public.clan_members m where m.clan_id = v_clan and m.user_id = v_uid and m.is_active;
  select * into c from public.clans where id = v_clan;
  select count(*) into v_n from public.clan_members where clan_id = v_clan and is_active;
  select count(*) into v_cnt from public.clan_contrib where clan_id = v_clan and week_start = v_week and kind = 'checkin';
  v_month := date_trunc('month', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran';

  return jsonb_build_object('ok', true,
    'clan', public.tl_clan_card(v_clan) || jsonb_build_object('leader', c.leader_id),
    'me', jsonb_build_object('id', v_uid, 'role', v_role,
      'joined_at', (select joined_at from public.clan_members where clan_id = v_clan and user_id = v_uid),
      'week_points', (select coalesce(sum(points), 0) from public.clan_contrib where clan_id = v_clan and user_id = v_uid and week_start = v_week),
      'week_checkins', (select count(*) from public.clan_contrib where clan_id = v_clan and user_id = v_uid and week_start = v_week and kind = 'checkin')),
    'code', (select code from public.clan_codes where clan_id = v_clan),
    'week', jsonb_build_object('start', v_week, 'ends_at', ((v_week + 7)::timestamp at time zone 'Asia/Tehran'),
      'checkins', v_cnt, 'points', public.tl_clan_week_points(v_clan, v_week),
      'tiers', (select jsonb_agg(jsonb_build_object('tier', t, 'need', public.tl_clan_tier_need(v_n, t), 'xp', public.tl_clan_tier_xp(t),
                  'reached', exists (select 1 from public.clan_week_tiers w where w.clan_id = v_clan and w.week_start = v_week and w.tier = t),
                  'claimed', exists (select 1 from public.clan_week_rewards w where w.user_id = v_uid and w.week_start = v_week and w.tier = t)) order by t)
                from generate_series(1, 3) t)),
    'rank', jsonb_build_object('week', public.tl_clan_week_rank(v_clan),
      'all', (select count(*) + 1 from public.clans k where k.disbanded_at is null and k.points > c.points),
      'of', (select count(*) from public.clans k where k.disbanded_at is null)),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object('id', m.user_id, 'card', public.tl_card(m.user_id), 'role', m.role, 'joined_at', m.joined_at,
               'week', coalesce(w.pts, 0), 'total', coalesce(t.pts, 0), 'me', m.user_id = v_uid)
             order by case m.role when 'leader' then 0 when 'officer' then 1 else 2 end, coalesce(w.pts, 0) desc, m.joined_at), '[]'::jsonb)
        from public.clan_members m
        left join (select user_id, sum(points) pts from public.clan_contrib where clan_id = v_clan and week_start = v_week group by user_id) w on w.user_id = m.user_id
        left join (select user_id, sum(points) pts from public.clan_contrib where clan_id = v_clan group by user_id) t on t.user_id = m.user_id
       where m.clan_id = v_clan and m.is_active),
    'requests', case when v_role in ('leader', 'officer') then (
      select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'card', public.tl_card(r.user_id), 'at', r.created_at,
               'level', (select coalesce(p.level, 1) from public.profiles p where p.id = r.user_id)) order by r.created_at), '[]'::jsonb)
        from public.clan_requests r where r.clan_id = v_clan and r.status = 'pending') else '[]'::jsonb end,
    'meetups', (
      select coalesce(jsonb_agg(x.j order by x.live desc, case when x.live then x.starts_at end asc, x.starts_at desc), '[]'::jsonb) from (
        select mu.starts_at, (mu.status = 'open' and mu.starts_at + interval '3 hours' > now()) as live,
          jsonb_build_object('id', mu.id, 'at', mu.starts_at, 'note', mu.note,
            'status', case when mu.status = 'open' and mu.starts_at + interval '3 hours' <= now() then 'expired' else mu.status end,
            'cafe', jsonb_build_object('id', cf.id, 'name', cf.name, 'district', cf.district, 'lat', cf.lat, 'lng', cf.lng),
            'by', public.tl_card(mu.created_by), 'mine', mu.created_by = v_uid,
            'going', (select coalesce(jsonb_agg(public.tl_card(rv.user_id) order by rv.created_at), '[]'::jsonb) from public.clan_meetup_rsvps rv where rv.meetup_id = mu.id and rv.going),
            'me_going', exists (select 1 from public.clan_meetup_rsvps rv where rv.meetup_id = mu.id and rv.user_id = v_uid and rv.going),
            'attended', (select count(*) from public.clan_meetup_rewards rw where rw.meetup_id = mu.id),
            'can_cancel', mu.status = 'open' and mu.starts_at + interval '3 hours' > now() and (mu.created_by = v_uid or v_role in ('leader', 'officer'))) j
          from public.clan_meetups mu join public.cafes cf on cf.id = mu.cafe_id
         where mu.clan_id = v_clan and (mu.starts_at + interval '3 hours' > now() or mu.starts_at > now() - interval '14 days')
         order by mu.starts_at desc limit 12) x),
    'meetup_cap', public.tl_clan_meetup_cap(public.tl_clan_level(c.points)),
    'posts', (
      select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'body', p.body, 'at', p.created_at, 'card', public.tl_card(p.user_id),
               'mine', p.user_id = v_uid, 'can_delete', p.user_id = v_uid or v_role in ('leader', 'officer'),
               'reported', exists (select 1 from public.clan_post_reports pr where pr.post_id = p.id and pr.user_id = v_uid)) order by p.created_at desc), '[]'::jsonb)
        from (select * from public.clan_posts where clan_id = v_clan and not hidden order by created_at desc limit 40) p),
    'events', (
      select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'at', e.created_at, 'data', e.data,
               'actor', case when e.actor is not null then public.tl_public_name(e.actor) end,
               'target', case when e.target is not null then public.tl_public_name(e.target) end) order by e.created_at desc), '[]'::jsonb)
        from (select * from public.clan_events where clan_id = v_clan order by created_at desc limit 30) e),
    'districts', (
      with s as (
        select public.region_num(k.district) d, k.clan_id, sum(k.points) pts from public.clan_contrib k
         where k.created_at >= v_month and public.region_num(k.district) is not null group by 1, 2),
      top as (select distinct on (d) d, clan_id, pts from s order by d, pts desc, clan_id)
      select coalesce(jsonb_agg(jsonb_build_object('district', s.d, 'pts', s.pts, 'held', top.clan_id = v_clan,
               'leader', case when top.clan_id <> v_clan then public.tl_clan_card(top.clan_id) end, 'leader_pts', top.pts) order by s.pts desc), '[]'::jsonb)
        from s join top on top.d = s.d where s.clan_id = v_clan),
    'season_ends', (date_trunc('month', now() at time zone 'Asia/Tehran') + interval '1 month') at time zone 'Asia/Tehran');
end $$;

-- نمای عمومی یک کلن برای کسی که عضوش نیست
create or replace function public.clan_view(p_id bigint)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); c public.clans; v_status text := 'none'; v_mine bigint; v_hidden integer; v_month timestamptz;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.clans where id = p_id and disbanded_at is null;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  select clan_id into v_mine from public.clan_members where user_id = v_uid and is_active;
  if v_mine = p_id then v_status := 'member';
  elsif v_mine is not null then v_status := 'other';
  elsif exists (select 1 from public.clan_requests where clan_id = p_id and user_id = v_uid and status = 'pending') then v_status := 'pending';
  end if;
  select count(*) into v_hidden from public.clan_members m join public.profiles p on p.id = m.user_id
   where m.clan_id = p_id and m.is_active and not (public.tl_priv(p.privacy, 'profile_public', true) and public.tl_priv(p.privacy, 'show_clan', true));
  v_month := date_trunc('month', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran';
  return jsonb_build_object('ok', true, 'status', v_status,
    'clan', public.tl_clan_card(p_id),
    'rank', jsonb_build_object('week', public.tl_clan_week_rank(p_id),
      'all', (select count(*) + 1 from public.clans k where k.disbanded_at is null and k.points > c.points),
      'of', (select count(*) from public.clans k where k.disbanded_at is null)),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object('id', m.user_id, 'card', public.tl_card(m.user_id), 'role', m.role)
             order by case m.role when 'leader' then 0 when 'officer' then 1 else 2 end, m.joined_at), '[]'::jsonb)
        from public.clan_members m join public.profiles p on p.id = m.user_id
       where m.clan_id = p_id and m.is_active and public.tl_priv(p.privacy, 'profile_public', true) and public.tl_priv(p.privacy, 'show_clan', true)),
    'hidden_members', v_hidden,
    'meetups_done', (select count(*) from public.clan_meetups where clan_id = p_id and status = 'done'),
    'districts', (
      with s as (
        select public.region_num(k.district) d, k.clan_id, sum(k.points) pts from public.clan_contrib k
         where k.created_at >= v_month and public.region_num(k.district) is not null group by 1, 2),
      top as (select distinct on (d) d, clan_id from s order by d, pts desc, clan_id)
      select coalesce(jsonb_agg(top.d order by top.d), '[]'::jsonb) from top where top.clan_id = p_id),
    'can', jsonb_build_object(
      'level_ok', (select coalesce(p.level, 1) >= c.min_level from public.profiles p where p.id = v_uid),
      'full', (select count(*) from public.clan_members where clan_id = p_id and is_active) >= public.tl_clan_cap(public.tl_clan_level(c.points)),
      'cooldown_until', (select cd.until from public.clan_cooldowns cd where cd.user_id = v_uid and cd.until > now()),
      'business', public.tl_is_business(v_uid)));
end $$;

-- فهرست کلن‌ها برای کاوش و رتبه‌بندی
create or replace function public.clan_browse(p_q text default null, p_sort text default 'week', p_limit integer default 30)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_q text; v_week date := public.tl_week_start(now()); v_mine bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  v_q := nullif(btrim(coalesce(p_q, '')), '');
  if v_q is not null then v_q := '%' || replace(replace(replace(left(v_q, 30), '\', '\\'), '%', '\%'), '_', '\_') || '%'; end if;
  select clan_id into v_mine from public.clan_members where user_id = v_uid and is_active;
  return jsonb_build_object('ok', true, 'mine', v_mine, 'list', (
    select coalesce(jsonb_agg(public.tl_clan_card(x.id) || jsonb_build_object('rank', x.rn, 'week_points', x.wp,
             'pending', exists (select 1 from public.clan_requests r where r.clan_id = x.id and r.user_id = v_uid and r.status = 'pending')) order by x.rn), '[]'::jsonb)
      from (
        select c.id, coalesce(w.pts, 0) wp,
          row_number() over (order by
            case when p_sort = 'all' then c.points when p_sort = 'members' then coalesce(mc.n, 0) when p_sort = 'new' then extract(epoch from c.created_at)::bigint else coalesce(w.pts, 0) end desc,
            c.points desc, c.id) rn
          from public.clans c
          left join (select clan_id, sum(points) pts from public.clan_contrib where week_start = v_week group by clan_id) w on w.clan_id = c.id
          left join (select clan_id, count(*) n from public.clan_members where is_active group by clan_id) mc on mc.clan_id = c.id
         where c.disbanded_at is null and (v_q is null or c.name ilike v_q escape '\' or coalesce(c.bio, '') ilike v_q escape '\')
         order by rn limit greatest(1, least(coalesce(p_limit, 30), 60))) x));
end $$;

-- پرچم مناطق در این ماه: صاحب هر منطقه و امتیاز کلن من
create or replace function public.clan_districts()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_month timestamptz; v_mine bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id into v_mine from public.clan_members where user_id = v_uid and is_active;
  v_month := date_trunc('month', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran';
  return jsonb_build_object('ok', true, 'ends_at', (date_trunc('month', now() at time zone 'Asia/Tehran') + interval '1 month') at time zone 'Asia/Tehran',
    'list', (
      with s as (
        select public.region_num(k.district) d, k.clan_id, sum(k.points) pts from public.clan_contrib k
          join public.clans c on c.id = k.clan_id and c.disbanded_at is null
         where k.created_at >= v_month and public.region_num(k.district) is not null group by 1, 2),
      top as (select distinct on (d) d, clan_id, pts from s order by d, pts desc, clan_id)
      select coalesce(jsonb_agg(jsonb_build_object('district', top.d, 'holder', public.tl_clan_card(top.clan_id), 'pts', top.pts,
               'mine', (select s2.pts from s s2 where s2.d = top.d and s2.clan_id = v_mine), 'held', top.clan_id = v_mine) order by top.d::integer), '[]'::jsonb)
        from top));
end $$;

-- برای برگه کافه: کلن‌هایی که این‌جا پاتوقشان است و دورهمی‌های کلن من در این کافه
create or replace function public.cafe_clan_info(p_cafe uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_mine bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id into v_mine from public.clan_members where user_id = v_uid and is_active;
  return jsonb_build_object('ok', true,
    'home', (select coalesce(jsonb_agg(public.tl_clan_card(c.id) order by c.points desc), '[]'::jsonb)
               from (select id, points from public.clans where home_cafe_id = p_cafe and disbanded_at is null order by points desc limit 5) c),
    'meetups', (select coalesce(jsonb_agg(jsonb_build_object('id', mu.id, 'at', mu.starts_at,
                  'going', (select count(*) from public.clan_meetup_rsvps rv where rv.meetup_id = mu.id and rv.going),
                  'me_going', exists (select 1 from public.clan_meetup_rsvps rv where rv.meetup_id = mu.id and rv.user_id = v_uid and rv.going)) order by mu.starts_at), '[]'::jsonb)
                  from public.clan_meetups mu
                 where v_mine is not null and mu.clan_id = v_mine and mu.cafe_id = p_cafe and mu.status = 'open' and mu.starts_at + interval '3 hours' > now()));
end $$;

-- ═════════ بخش 4: نوشتن ═════════

create or replace function public.tl_clan_emblems()
returns text[] language sql immutable set search_path to ''
as $$ select array['flame', 'coffee', 'compass', 'crown', 'star', 'bolt', 'target', 'map', 'music', 'book', 'sofa', 'sunrise', 'shield', 'trophy', 'globe', 'users'] $$;

create or replace function public.tl_clan_colors()
returns text[] language sql immutable set search_path to ''
as $$ select array['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#71717A'] $$;

-- خطای نام کلن یا null
create or replace function public.tl_clan_name_error(p_name text, p_self bigint)
returns text language sql stable security definer set search_path to ''
as $$
  select case
    when char_length(coalesce(p_name, '')) < 2 or char_length(p_name) > 24 then 'name_len'
    when p_name ~ '[<>{}\\]' or public.tl_text_has_contact(p_name) then 'name_chars'
    when exists (select 1 from public.clans c where lower(c.name) = lower(p_name) and c.disbanded_at is null and c.id is distinct from p_self) then 'name_taken'
    else null end
$$;

create or replace function public.clan_create2(p jsonb)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare
  v_uid uuid := auth.uid(); v_name text; v_err text; v_motto text; v_mode text; v_min integer; v_home uuid; v_id bigint; v_code text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p is null or jsonb_typeof(p) <> 'object' then return jsonb_build_object('ok', false, 'error', 'input'); end if;
  if public.tl_is_business(v_uid) then return jsonb_build_object('ok', false, 'error', 'business'); end if;
  if exists (select 1 from public.clan_members where user_id = v_uid and is_active) then return jsonb_build_object('ok', false, 'error', 'in_clan'); end if;
  if exists (select 1 from public.clans where created_by = v_uid and created_at > now() - interval '7 days') then
    return jsonb_build_object('ok', false, 'error', 'create_cooldown',
      'until', (select max(created_at) + interval '7 days' from public.clans where created_by = v_uid)); end if;
  v_name := public.tl_clean_text(p ->> 'name');
  v_err := public.tl_clan_name_error(v_name, null);
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  v_motto := nullif(public.tl_clean_text(p ->> 'motto'), '');
  if char_length(coalesce(v_motto, '')) > 120 then return jsonb_build_object('ok', false, 'error', 'motto_len'); end if;
  if public.tl_text_has_contact(v_motto) then return jsonb_build_object('ok', false, 'error', 'motto_links'); end if;
  v_mode := case when p ->> 'join_mode' in ('open', 'request', 'invite') then p ->> 'join_mode' else 'open' end;
  v_min := case when coalesce(p ->> 'min_level', '') ~ '^[0-9]{1,2}$' then least(10, greatest(1, (p ->> 'min_level')::integer)) else 1 end;
  if coalesce(p ->> 'home_cafe_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select id into v_home from public.cafes where id = (p ->> 'home_cafe_id')::uuid and is_active;
    if v_home is null then return jsonb_build_object('ok', false, 'error', 'home'); end if;
  end if;

  insert into public.clans (name, emblem, color, bio, leader_id, created_by, join_mode, min_level, home_cafe_id)
  values (v_name,
          case when p ->> 'emblem' = any (public.tl_clan_emblems()) then p ->> 'emblem' else 'flame' end,
          case when upper(coalesce(p ->> 'color', '')) = any (public.tl_clan_colors()) then upper(p ->> 'color') else '#8B5CF6' end,
          v_motto, v_uid, v_uid, v_mode, v_min, v_home)
  returning id into v_id;
  update public.clan_requests set status = 'cancelled' where user_id = v_uid and status = 'pending';
  perform public.tl_clan_member_set(v_id, v_uid, 'leader');
  v_code := public.tl_clan_set_code(v_id);
  perform public.tl_clan_event(v_id, 'created', v_uid, null, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'id', v_id, 'code', v_code);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'name_taken');
end $$;

create or replace function public.clan_update(p jsonb)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text; c public.clans; v_name text; v_err text; v_motto text; v_home uuid; v_keys text[] := '{}';
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p is null or jsonb_typeof(p) <> 'object' then return jsonb_build_object('ok', false, 'error', 'input'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if v_clan is null then return jsonb_build_object('ok', false, 'error', 'no_clan'); end if;
  if v_role not in ('leader', 'officer') then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if v_role = 'officer' and exists (select 1 from jsonb_object_keys(p) k where k <> 'motto') then
    return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  select * into c from public.clans where id = v_clan for update;
  v_name := c.name; v_motto := c.bio; v_home := c.home_cafe_id;
  if p ? 'name' then
    v_name := public.tl_clean_text(p ->> 'name');
    v_err := public.tl_clan_name_error(v_name, v_clan);
    if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
    v_keys := array_append(v_keys, 'name');
  end if;
  if p ? 'motto' then
    v_motto := nullif(public.tl_clean_text(p ->> 'motto'), '');
    if char_length(coalesce(v_motto, '')) > 120 then return jsonb_build_object('ok', false, 'error', 'motto_len'); end if;
    if public.tl_text_has_contact(v_motto) then return jsonb_build_object('ok', false, 'error', 'motto_links'); end if;
    v_keys := array_append(v_keys, 'motto');
  end if;
  if p ? 'home_cafe_id' then
    v_home := null;
    if coalesce(p ->> 'home_cafe_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select id into v_home from public.cafes where id = (p ->> 'home_cafe_id')::uuid and is_active;
      if v_home is null then return jsonb_build_object('ok', false, 'error', 'home'); end if;
    end if;
    v_keys := array_append(v_keys, 'home');
  end if;
  update public.clans set
    name = v_name, bio = v_motto, home_cafe_id = v_home,
    emblem = case when p ? 'emblem' and p ->> 'emblem' = any (public.tl_clan_emblems()) then p ->> 'emblem' else emblem end,
    color = case when p ? 'color' and upper(coalesce(p ->> 'color', '')) = any (public.tl_clan_colors()) then upper(p ->> 'color') else color end,
    join_mode = case when p ->> 'join_mode' in ('open', 'request', 'invite') then p ->> 'join_mode' else join_mode end,
    min_level = case when coalesce(p ->> 'min_level', '') ~ '^[0-9]{1,2}$' then least(10, greatest(1, (p ->> 'min_level')::integer)) else min_level end,
    updated_at = now()
  where id = v_clan;
  if p ? 'emblem' or p ? 'color' then v_keys := array_append(v_keys, 'look'); end if;
  if p ? 'join_mode' or p ? 'min_level' then v_keys := array_append(v_keys, 'join'); end if;
  perform public.tl_clan_event(v_clan, 'settings', v_uid, null, jsonb_build_object('keys', to_jsonb(v_keys)));
  return jsonb_build_object('ok', true, 'clan', public.tl_clan_card(v_clan));
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'name_taken');
end $$;

create or replace function public.clan_join2(p_clan bigint default null, p_code text default null)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_via boolean := false; c public.clans; v_lvl integer; v_n integer; v_until timestamptz;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if public.tl_is_business(v_uid) then return jsonb_build_object('ok', false, 'error', 'business'); end if;
  if exists (select 1 from public.clan_members where user_id = v_uid and is_active) then return jsonb_build_object('ok', false, 'error', 'in_clan'); end if;
  select until into v_until from public.clan_cooldowns where user_id = v_uid and until > now();
  if v_until is not null then return jsonb_build_object('ok', false, 'error', 'cooldown', 'until', v_until); end if;
  if nullif(btrim(coalesce(p_code, '')), '') is not null then
    select clan_id into v_clan from public.clan_codes where code = upper(btrim(p_code));
    if v_clan is null then return jsonb_build_object('ok', false, 'error', 'code'); end if;
    v_via := true;
  else
    v_clan := p_clan;
  end if;
  select * into c from public.clans where id = v_clan and disbanded_at is null;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  select count(*) into v_n from public.clan_members where clan_id = v_clan and is_active;
  if v_n >= public.tl_clan_cap(public.tl_clan_level(c.points)) then return jsonb_build_object('ok', false, 'error', 'full'); end if;
  if not v_via then
    select coalesce(level, 1) into v_lvl from public.profiles where id = v_uid;
    if v_lvl < c.min_level then return jsonb_build_object('ok', false, 'error', 'level', 'need', c.min_level); end if;
    if c.join_mode = 'invite' then return jsonb_build_object('ok', false, 'error', 'invite_only'); end if;
    if c.join_mode = 'request' then
      insert into public.clan_requests (clan_id, user_id) values (v_clan, v_uid) on conflict do nothing;
      if found then
        perform public.tl_clan_notify(v_clan, 'clan_request', 'درخواست عضویت تازه',
          public.tl_public_name(v_uid) || ' می‌خواهد به «' || c.name || '» بپیوندد.', '/clan?tab=members', null, array['leader', 'officer']);
      end if;
      return jsonb_build_object('ok', true, 'pending', true, 'clan_id', v_clan);
    end if;
  end if;
  perform public.tl_clan_member_set(v_clan, v_uid, 'member');
  update public.clan_requests set status = 'cancelled' where user_id = v_uid and status = 'pending';
  perform public.tl_clan_event(v_clan, 'joined', v_uid, null, jsonb_build_object('via', case when v_via then 'code' else 'open' end));
  perform public.tl_clan_notify(v_clan, 'clan_join', 'عضو تازه', public.tl_public_name(v_uid) || ' به «' || c.name || '» پیوست.', '/clan?tab=members', v_uid, array['leader', 'officer']);
  return jsonb_build_object('ok', true, 'joined', true, 'clan_id', v_clan);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'in_clan');
end $$;

create or replace function public.clan_request_cancel(p_clan bigint)
returns jsonb language plpgsql security definer set search_path to ''
as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update public.clan_requests set status = 'cancelled' where clan_id = p_clan and user_id = auth.uid() and status = 'pending';
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_request_decide(p_request bigint, p_accept boolean)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); r public.clan_requests; c public.clans; v_role text; v_n integer;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into r from public.clan_requests where id = p_request and status = 'pending' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  v_role := public.tl_clan_role_of(r.clan_id, v_uid);
  if coalesce(v_role, '') not in ('leader', 'officer') then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  select * into c from public.clans where id = r.clan_id;
  if coalesce(p_accept, false) then
    if exists (select 1 from public.clan_members where user_id = r.user_id and is_active) then
      update public.clan_requests set status = 'cancelled', decided_by = v_uid, decided_at = now() where id = r.id;
      return jsonb_build_object('ok', false, 'error', 'taken');
    end if;
    select count(*) into v_n from public.clan_members where clan_id = r.clan_id and is_active;
    if v_n >= public.tl_clan_cap(public.tl_clan_level(c.points)) then return jsonb_build_object('ok', false, 'error', 'full'); end if;
    perform public.tl_clan_member_set(r.clan_id, r.user_id, 'member');
    update public.clan_requests set status = 'accepted', decided_by = v_uid, decided_at = now() where id = r.id;
    update public.clan_requests set status = 'cancelled' where user_id = r.user_id and status = 'pending';
    perform public.tl_clan_event(r.clan_id, 'joined', r.user_id, v_uid, jsonb_build_object('via', 'request'));
    perform public.push_notification(r.user_id, 'clan_accept', 'درخواستت پذیرفته شد', 'حالا عضو «' || c.name || '» هستی.', '👥', '/clan');
  else
    update public.clan_requests set status = 'declined', decided_by = v_uid, decided_at = now() where id = r.id;
    perform public.push_notification(r.user_id, 'clan_decline', 'درخواست عضویت پذیرفته نشد', '«' || c.name || '» این بار درخواستت را نپذیرفت. کلن‌های دیگر را ببین.', '👥', '/clan');
  end if;
  return jsonb_build_object('ok', true);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'taken');
end $$;

-- انحلال؛ فقط از داخل تابع‌های دیگر
create or replace function public.tl_clan_disband_internal(p_clan bigint, p_actor uuid)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_name text;
begin
  select name into v_name from public.clans where id = p_clan;
  perform public.tl_clan_notify(p_clan, 'clan_disband', 'کلن منحل شد', '«' || v_name || '» منحل شد. می‌توانی کلن تازه بسازی یا به کلن دیگری بپیوندی.', '/clan', p_actor);
  update public.clans set disbanded_at = now(), name = left(name, 24) || ' · ' || id, home_cafe_id = null, updated_at = now() where id = p_clan;
  update public.clan_meetups set status = 'cancelled' where clan_id = p_clan and status = 'open';
  update public.clan_requests set status = 'cancelled' where clan_id = p_clan and status = 'pending';
  insert into public.clan_history (user_id, clan_id, clan_name, event_type, detail)
  select user_id, p_clan, v_name, 'left', 'کلن منحل شد' from public.clan_members where clan_id = p_clan and is_active;
  update public.clan_members set is_active = false, left_at = now(), role = 'member' where clan_id = p_clan and is_active;
end $$;
revoke all on function public.tl_clan_disband_internal(bigint, uuid), public.tl_clan_name_error(text, bigint) from public, anon, authenticated;

create or replace function public.clan_leave2()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text; v_next uuid; v_name text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if v_clan is null then return jsonb_build_object('ok', false, 'error', 'no_clan'); end if;
  select name into v_name from public.clans where id = v_clan;
  insert into public.clan_cooldowns (user_id, until) values (v_uid, now() + interval '24 hours')
  on conflict (user_id) do update set until = excluded.until;
  if v_role = 'leader' then
    select user_id into v_next from public.clan_members where clan_id = v_clan and is_active and user_id <> v_uid
     order by (role = 'officer') desc, joined_at limit 1;
    if v_next is null then
      perform public.tl_clan_disband_internal(v_clan, v_uid);
      return jsonb_build_object('ok', true, 'disbanded', true);
    end if;
    update public.clan_members set role = 'leader' where clan_id = v_clan and user_id = v_next;
    update public.clans set leader_id = v_next, updated_at = now() where id = v_clan;
    perform public.tl_clan_event(v_clan, 'leader', v_uid, v_next, '{}'::jsonb);
    perform public.push_notification(v_next, 'clan_leader', 'رهبر کلن شدی', 'رهبر قبلی «' || v_name || '» کلن را ترک کرد و رهبری به تو رسید.', '👑', '/clan');
  end if;
  perform public.tl_clan_member_leave(v_clan, v_uid);
  perform public.tl_clan_event(v_clan, 'left', v_uid, null, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_disband()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if v_clan is null then return jsonb_build_object('ok', false, 'error', 'no_clan'); end if;
  if v_role <> 'leader' then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  insert into public.clan_cooldowns (user_id, until) values (v_uid, now() + interval '24 hours')
  on conflict (user_id) do update set until = excluded.until;
  perform public.tl_clan_disband_internal(v_clan, v_uid);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_kick(p_user uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text; v_target text; v_name text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if v_clan is null then return jsonb_build_object('ok', false, 'error', 'no_clan'); end if;
  v_target := public.tl_clan_role_of(v_clan, p_user);
  if v_target is null or p_user = v_uid then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if not ((v_role = 'leader' and v_target in ('officer', 'member')) or (v_role = 'officer' and v_target = 'member')) then
    return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if v_role = 'officer' and exists (select 1 from public.clan_events where clan_id = v_clan and kind = 'kicked' and actor = v_uid and created_at > now() - interval '20 minutes') then
    return jsonb_build_object('ok', false, 'error', 'kick_cooldown'); end if;
  select name into v_name from public.clans where id = v_clan;
  perform public.tl_clan_member_leave(v_clan, p_user);
  perform public.tl_clan_event(v_clan, 'kicked', v_uid, p_user, '{}'::jsonb);
  perform public.push_notification(p_user, 'clan_kick', 'دیگر عضو کلن نیستی', 'رهبری «' || v_name || '» تو را از کلن بیرون کرد. می‌توانی به کلن دیگری بپیوندی.', '👥', '/clan');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_set_role(p_user uuid, p_role text)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text; v_target text; v_name text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_role not in ('officer', 'member') then return jsonb_build_object('ok', false, 'error', 'input'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if v_role is distinct from 'leader' then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  v_target := public.tl_clan_role_of(v_clan, p_user);
  if v_target is null or v_target = 'leader' then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if p_role = 'officer' and v_target <> 'officer' and (select count(*) from public.clan_members where clan_id = v_clan and is_active and role = 'officer') >= 4 then
    return jsonb_build_object('ok', false, 'error', 'officer_limit'); end if;
  update public.clan_members set role = p_role where clan_id = v_clan and user_id = p_user;
  select name into v_name from public.clans where id = v_clan;
  perform public.tl_clan_event(v_clan, 'role', v_uid, p_user, jsonb_build_object('role', p_role));
  perform public.push_notification(p_user, 'clan_role', case when p_role = 'officer' then 'معاون کلن شدی' else 'نقشت در کلن عوض شد' end,
    case when p_role = 'officer' then 'حالا معاون «' || v_name || '» هستی و درخواست‌ها را می‌پذیری.' else 'حالا عضو «' || v_name || '» هستی.' end, '👥', '/clan');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_transfer(p_user uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text; v_name text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if v_role is distinct from 'leader' then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if p_user = v_uid or public.tl_clan_role_of(v_clan, p_user) is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  update public.clan_members set role = 'officer' where clan_id = v_clan and user_id = v_uid;
  update public.clan_members set role = 'leader' where clan_id = v_clan and user_id = p_user;
  update public.clans set leader_id = p_user, updated_at = now() where id = v_clan;
  select name into v_name from public.clans where id = v_clan;
  perform public.tl_clan_event(v_clan, 'leader', v_uid, p_user, '{}'::jsonb);
  perform public.push_notification(p_user, 'clan_leader', 'رهبر کلن شدی', public.tl_public_name(v_uid) || ' رهبری «' || v_name || '» را به تو سپرد.', '👑', '/clan');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_code_regen()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_role text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select clan_id, role into v_clan, v_role from public.clan_members where user_id = v_uid and is_active;
  if coalesce(v_role, '') not in ('leader', 'officer') then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  return jsonb_build_object('ok', true, 'code', public.tl_clan_set_code(v_clan));
end $$;

create or replace function public.clan_meetup_create(p_cafe uuid, p_at timestamptz, p_note text default null)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_pts bigint; v_note text; v_cafe text; v_id bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select m.clan_id, c.points into v_clan, v_pts from public.clan_members m join public.clans c on c.id = m.clan_id where m.user_id = v_uid and m.is_active;
  if v_clan is null then return jsonb_build_object('ok', false, 'error', 'no_clan'); end if;
  select name into v_cafe from public.cafes where id = p_cafe and is_active;
  if v_cafe is null then return jsonb_build_object('ok', false, 'error', 'cafe'); end if;
  if p_at is null or p_at < now() + interval '10 minutes' or p_at > now() + interval '7 days' then return jsonb_build_object('ok', false, 'error', 'time'); end if;
  v_note := nullif(public.tl_clean_text(p_note), '');
  if char_length(coalesce(v_note, '')) > 80 then return jsonb_build_object('ok', false, 'error', 'note_len'); end if;
  if public.tl_text_has_contact(v_note) then return jsonb_build_object('ok', false, 'error', 'no_links'); end if;
  if exists (select 1 from public.clan_meetups where clan_id = v_clan and created_by = v_uid and status = 'open' and starts_at + interval '3 hours' > now()) then
    return jsonb_build_object('ok', false, 'error', 'mine_open'); end if;
  if (select count(*) from public.clan_meetups where clan_id = v_clan and status = 'open' and starts_at + interval '3 hours' > now())
     >= public.tl_clan_meetup_cap(public.tl_clan_level(v_pts)) then
    return jsonb_build_object('ok', false, 'error', 'meetup_limit'); end if;
  insert into public.clan_meetups (clan_id, cafe_id, starts_at, note, created_by) values (v_clan, p_cafe, p_at, v_note, v_uid) returning id into v_id;
  insert into public.clan_meetup_rsvps (meetup_id, user_id) values (v_id, v_uid);
  perform public.tl_clan_event(v_clan, 'meetup', v_uid, null, jsonb_build_object('cafe', v_cafe, 'at', p_at, 'meetup', v_id));
  perform public.tl_clan_notify(v_clan, 'clan_meetup', 'دورهمی تازه در «' || v_cafe || '»',
    public.tl_public_name(v_uid) || ' دورهمی گذاشت. ساعتش را در صفحه کلن ببین و اگر می‌آیی «میام» را بزن.', '/clan?tab=meetups', v_uid);
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.clan_meetup_rsvp(p_meetup bigint, p_going boolean)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); mu public.clan_meetups;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into mu from public.clan_meetups where id = p_meetup;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if mu.clan_id is distinct from public.tl_my_clan_id() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if mu.status <> 'open' or mu.starts_at + interval '3 hours' < now() then return jsonb_build_object('ok', false, 'error', 'closed'); end if;
  if coalesce(p_going, false) then
    insert into public.clan_meetup_rsvps (meetup_id, user_id, going) values (p_meetup, v_uid, true)
    on conflict (meetup_id, user_id) do update set going = true, created_at = now();
  else
    update public.clan_meetup_rsvps set going = false where meetup_id = p_meetup and user_id = v_uid;
  end if;
  return jsonb_build_object('ok', true, 'going', (select count(*) from public.clan_meetup_rsvps where meetup_id = p_meetup and going));
end $$;

create or replace function public.clan_meetup_cancel(p_meetup bigint)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); mu public.clan_meetups; v_role text; v_cafe text; m record;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into mu from public.clan_meetups where id = p_meetup for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  v_role := public.tl_clan_role_of(mu.clan_id, v_uid);
  if v_role is null or not (mu.created_by = v_uid or v_role in ('leader', 'officer')) then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if mu.status <> 'open' then return jsonb_build_object('ok', false, 'error', 'closed'); end if;
  update public.clan_meetups set status = 'cancelled' where id = p_meetup;
  select name into v_cafe from public.cafes where id = mu.cafe_id;
  for m in select user_id from public.clan_meetup_rsvps where meetup_id = p_meetup and going and user_id <> v_uid loop
    perform public.push_notification(m.user_id, 'clan_meetup_cancel', 'دورهمی لغو شد', 'دورهمی کلن در «' || v_cafe || '» لغو شد.', '👥', '/clan?tab=meetups');
  end loop;
  perform public.tl_clan_event(mu.clan_id, 'meetup_cancel', v_uid, null, jsonb_build_object('cafe', v_cafe, 'meetup', p_meetup));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_post_create(p_body text)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_clan bigint; v_body text; v_id bigint;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  v_clan := public.tl_my_clan_id();
  if v_clan is null then return jsonb_build_object('ok', false, 'error', 'no_clan'); end if;
  v_body := public.tl_clean_text(p_body);
  if char_length(v_body) < 2 then return jsonb_build_object('ok', false, 'error', 'short'); end if;
  if char_length(v_body) > 200 then return jsonb_build_object('ok', false, 'error', 'long'); end if;
  if public.tl_text_has_contact(v_body) then return jsonb_build_object('ok', false, 'error', 'no_links'); end if;
  if (select count(*) from public.clan_posts where user_id = v_uid and created_at > now() - interval '24 hours') >= 20
     or exists (select 1 from public.clan_posts where user_id = v_uid and created_at > now() - interval '5 seconds') then
    return jsonb_build_object('ok', false, 'error', 'rate'); end if;
  insert into public.clan_posts (clan_id, user_id, body) values (v_clan, v_uid, v_body) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.clan_post_delete(p_id bigint)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); p public.clan_posts; v_role text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into p from public.clan_posts where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  v_role := public.tl_clan_role_of(p.clan_id, v_uid);
  if v_role is null or not (p.user_id = v_uid or v_role in ('leader', 'officer')) then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  update public.clan_posts set hidden = true where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.clan_post_report(p_id bigint)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); p public.clan_posts;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into p from public.clan_posts where id = p_id;
  if not found or p.clan_id is distinct from public.tl_my_clan_id() then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if p.user_id = v_uid then return jsonb_build_object('ok', false, 'error', 'own'); end if;
  insert into public.clan_post_reports (post_id, user_id) values (p_id, v_uid) on conflict do nothing;
  if found then
    update public.clan_posts set reports = reports + 1, hidden = (reports + 1 >= 3) or hidden where id = p_id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ═════════ بخش 5: تریگر چک‌این ═════════
-- امتیاز کلن، صندوق‌های هفته، سطح کلن و دورهمی. هر خطا اینجا چک‌این را خراب نمی‌کند.
create or replace function public.tl_clan_on_checkin()
returns trigger language plpgsql security definer set search_path to ''
as $$
declare
  v_clan bigint; v_pts integer; v_week date; v_n integer; v_cnt integer; t integer; v_need integer;
  v_old bigint; v_new bigint; v_name text; v_district text; v_min integer; v_att integer; r record; m record;
  v_tier_names text[] := array['برنزی', 'نقره‌ای', 'طلایی'];
begin
  select clan_id into v_clan from public.clan_members where user_id = new.user_id and is_active;
  if v_clan is null then return new; end if;
  select name, points into v_name, v_old from public.clans where id = v_clan and disbanded_at is null;
  if v_name is null then return new; end if;
  select count(*) into v_n from public.clan_members where clan_id = v_clan and is_active;
  v_pts := greatest(coalesce(new.xp_awarded, new.xp_earned, 0), 0);
  v_week := public.tl_week_start(new.created_at);

  if v_pts > 0 then
    select coalesce(new.district, cf.district) into v_district from public.cafes cf where cf.id = new.cafe_id;
    insert into public.clan_contrib (clan_id, user_id, kind, points, checkin_id, cafe_id, district, week_start, created_at)
    values (v_clan, new.user_id, 'checkin', v_pts, new.id, new.cafe_id, coalesce(v_district, new.district), v_week, new.created_at)
    on conflict do nothing;
    if found then
      update public.clans set points = points + v_pts where id = v_clan returning points into v_new;
      if public.tl_clan_level(v_new) > public.tl_clan_level(v_old) then
        perform public.tl_clan_event(v_clan, 'level', null, null, jsonb_build_object('level', public.tl_clan_level(v_new)));
        perform public.tl_clan_notify(v_clan, 'clan_level', '«' || v_name || '» سطح ' || public.tl_fa_digits(public.tl_clan_level(v_new)::text) || ' شد',
          'سقف اعضا حالا ' || public.tl_fa_digits(public.tl_clan_cap(public.tl_clan_level(v_new))::text) || ' نفر است.', '/clan');
      end if;
      -- صندوق‌های هفته: جایزه فقط برای کسی که خودش این هفته چک‌این دارد، هر پله برای هر نفر هفته‌ای یک بار
      select count(*) into v_cnt from public.clan_contrib where clan_id = v_clan and week_start = v_week and kind = 'checkin';
      for t in 1..3 loop
        v_need := public.tl_clan_tier_need(v_n, t);
        exit when v_cnt < v_need;
        insert into public.clan_week_tiers (clan_id, week_start, tier) values (v_clan, v_week, t) on conflict do nothing;
        if found then
          perform public.tl_clan_event(v_clan, 'tier', null, null, jsonb_build_object('tier', t, 'xp', public.tl_clan_tier_xp(t)));
        end if;
        for m in select distinct k.user_id from public.clan_contrib k
                   join public.clan_members cm on cm.user_id = k.user_id and cm.clan_id = v_clan and cm.is_active
                  where k.clan_id = v_clan and k.week_start = v_week and k.kind = 'checkin' loop
          insert into public.clan_week_rewards (user_id, week_start, tier, clan_id, xp)
          values (m.user_id, v_week, t, v_clan, public.tl_clan_tier_xp(t)) on conflict do nothing;
          if found then
            perform public.tl_award_system(m.user_id, public.tl_clan_tier_xp(t), 'clan_tier');
            perform public.push_notification(m.user_id, 'clan_tier', 'صندوق ' || v_tier_names[t] || ' کلن باز شد',
              'کلن «' || v_name || '» به هدف هفته رسید و ' || public.tl_fa_digits(public.tl_clan_tier_xp(t)::text) || ' امتیاز گرفتی.', '🎁', '/clan');
          end if;
        end loop;
      end loop;
    end if;
  end if;

  -- دورهمی: اگر در بازه دورهمی دست‌کم 3 عضو، یا 2 عضو در کلن کمتر از 4 نفر، این‌جا چک‌این کرده باشند
  v_min := case when v_n < 4 then 2 else 3 end;
  for r in select * from public.clan_meetups
            where clan_id = v_clan and cafe_id = new.cafe_id and status in ('open', 'done')
              and new.created_at between starts_at - interval '30 minutes' and starts_at + interval '3 hours' loop
    select count(distinct ci.user_id) into v_att from public.checkins ci
      join public.clan_members cm on cm.user_id = ci.user_id and cm.clan_id = v_clan and cm.is_active
     where ci.cafe_id = r.cafe_id and ci.created_at between r.starts_at - interval '30 minutes' and r.starts_at + interval '3 hours';
    if v_att >= v_min then
      if r.status = 'open' then
        update public.clan_meetups set status = 'done', done_at = now() where id = r.id;
        insert into public.clan_contrib (clan_id, user_id, kind, points, cafe_id, district, week_start)
        select v_clan, null, 'meetup', 50, r.cafe_id, cf.district, public.tl_week_start(now()) from public.cafes cf where cf.id = r.cafe_id;
        update public.clans set points = points + 50 where id = v_clan;
        perform public.tl_clan_event(v_clan, 'meetup_done', null, null, jsonb_build_object('meetup', r.id, 'count', v_att,
          'cafe', (select name from public.cafes where id = r.cafe_id)));
      end if;
      for m in select distinct ci.user_id from public.checkins ci
                 join public.clan_members cm on cm.user_id = ci.user_id and cm.clan_id = v_clan and cm.is_active
                where ci.cafe_id = r.cafe_id and ci.created_at between r.starts_at - interval '30 minutes' and r.starts_at + interval '3 hours' loop
        insert into public.clan_meetup_rewards (meetup_id, user_id, reward_day)
        values (r.id, m.user_id, (now() at time zone 'Asia/Tehran')::date) on conflict do nothing;
        if found then
          perform public.tl_award_system(m.user_id, 30, 'clan_meetup');
          perform public.push_notification(m.user_id, 'clan_meetup_done', 'دورهمی کلن برگزار شد',
            public.tl_fa_digits(v_att::text) || ' نفر از «' || v_name || '» با هم آمدند و 30 امتیاز گرفتی.', '🎉', '/clan?tab=meetups');
        end if;
      end loop;
    end if;
  end loop;
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.tl_clan_on_checkin() from public, anon, authenticated;

create or replace trigger checkins_clan after insert on public.checkins for each row execute function public.tl_clan_on_checkin();

-- ═════════ بخش 6: سازگاری نسخه‌های قبل و بستن نشت‌ها ═════════

-- اعضای کلن فقط برای خود آن کلن دیده می‌شوند، نه برای همه
alter policy "read members" on public.clan_members using (user_id = auth.uid() or (is_active and clan_id = public.tl_my_clan_id()));
revoke all on public.clan_members, public.clans, public.clan_history, public.clan_missions from anon, authenticated;
grant select on public.clan_members, public.clans, public.clan_history, public.clan_missions to authenticated;

-- نمای قدیمی امتیاز کلن‌ها: حالا امتیاز کلن، نه جمع امتیاز اعضا، و بدون کد دعوت
create or replace view public.clan_standings as
  select c.id, c.name, c.emblem, c.color, c.bio, c.leader_id, null::text as join_code,
    (select count(*) from public.clan_members m where m.clan_id = c.id and m.is_active) as member_count,
    c.points as xp_total,
    public.tl_clan_week_points(c.id, public.tl_week_start(now())) as xp_weekly,
    public.tl_clan_level(c.points)::bigint as level
  from public.clans c where c.disbanded_at is null;
revoke all on public.clan_standings, public.region_clan_leaderboard, public.business_clans from anon, authenticated;
grant select on public.clan_standings, public.region_clan_leaderboard, public.business_clans to authenticated;
grant execute on function public.tl_clan_week_points(bigint, date) to authenticated;

-- تابع‌های قدیمی همان امضا را نگه می‌دارند و کار را به تابع‌های تازه می‌سپارند
create or replace function public.clan_create(p_name text, p_emblem text default '⚔️'::text, p_color text default '#8b5cf6'::text, p_bio text default null::text)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare v jsonb;
begin
  v := public.clan_create2(jsonb_build_object('name', p_name, 'emblem', p_emblem, 'color', p_color, 'motto', p_bio));
  if coalesce((v ->> 'ok')::boolean, false) then return json_build_object('ok', true, 'clan_id', (v ->> 'id')::bigint); end if;
  return v::json;
end $$;

create or replace function public.clan_join(p_clan_id bigint default null::bigint, p_code text default null::text)
returns json language plpgsql security definer set search_path to 'public'
as $$ begin return public.clan_join2(p_clan_id, p_code)::json; end $$;

create or replace function public.clan_leave(p_clan_id bigint)
returns json language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.clan_members where clan_id = p_clan_id and user_id = auth.uid() and is_active) then
    return json_build_object('ok', false, 'error', 'not_member'); end if;
  return public.clan_leave2()::json;
end $$;

create or replace function public.clan_set_active(p_clan_id bigint)
returns json language plpgsql security definer set search_path to 'public'
as $$
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if not exists (select 1 from public.clan_members where clan_id = p_clan_id and user_id = auth.uid() and is_active) then
    return json_build_object('ok', false, 'error', 'not_member'); end if;
  return json_build_object('ok', true);
end $$;

-- دسترسی تابع‌های کاربر
revoke all on function public.clan_home(), public.clan_view(bigint), public.clan_browse(text, text, integer), public.clan_districts(),
  public.cafe_clan_info(uuid), public.clan_create2(jsonb), public.clan_update(jsonb), public.clan_join2(bigint, text),
  public.clan_request_cancel(bigint), public.clan_request_decide(bigint, boolean), public.clan_leave2(), public.clan_disband(),
  public.clan_kick(uuid), public.clan_set_role(uuid, text), public.clan_transfer(uuid), public.clan_code_regen(),
  public.clan_meetup_create(uuid, timestamptz, text), public.clan_meetup_rsvp(bigint, boolean), public.clan_meetup_cancel(bigint),
  public.clan_post_create(text), public.clan_post_delete(bigint), public.clan_post_report(bigint) from public, anon;
grant execute on function public.clan_home(), public.clan_view(bigint), public.clan_browse(text, text, integer), public.clan_districts(),
  public.cafe_clan_info(uuid), public.clan_create2(jsonb), public.clan_update(jsonb), public.clan_join2(bigint, text),
  public.clan_request_cancel(bigint), public.clan_request_decide(bigint, boolean), public.clan_leave2(), public.clan_disband(),
  public.clan_kick(uuid), public.clan_set_role(uuid, text), public.clan_transfer(uuid), public.clan_code_regen(),
  public.clan_meetup_create(uuid, timestamptz, text), public.clan_meetup_rsvp(bigint, boolean), public.clan_meetup_cancel(bigint),
  public.clan_post_create(text), public.clan_post_delete(bigint), public.clan_post_report(bigint) to authenticated;

-- لحظه‌ای: تابلو، خبرها و دورهمی‌ها
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'clan_posts') then
    alter publication supabase_realtime add table public.clan_posts; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'clan_events') then
    alter publication supabase_realtime add table public.clan_events; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'clan_meetups') then
    alter publication supabase_realtime add table public.clan_meetups; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'clan_meetup_rsvps') then
    alter publication supabase_realtime add table public.clan_meetup_rsvps; end if;
end $$;

-- پروفایل عمومی: کلن با شناسه و رنگ، تا به صفحه کلن پیوند بخورد
do $$
declare d text;
        a text := $x$jsonb_build_object('name', c.name, 'emblem', c.emblem)$x$;
        b text := $x$jsonb_build_object('id', c.id, 'name', c.name, 'emblem', c.emblem, 'color', c.color)$x$;
begin
  select pg_get_functiondef('public.public_profile(uuid)'::regprocedure) into d;
  if position(b in d) > 0 then return; end if;
  if position(a in d) = 0 then raise exception 'public_profile clan block not found'; end if;
  execute replace(d, a, b);
end $$;
