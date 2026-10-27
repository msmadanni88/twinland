-- ─────────────────────────────────────────────────────────────
--  TwinLand — نسخه v5.0 «کسب‌وکارها» — بخش یکم — 27 اکتبر 2026
--  طرح: claude/TwinLand_SME_Expansion_Design.md و پوشه SME روی کامپیوتر دنی
--
--  بخش 1: دسته‌های مکان و پروفایل رفتار هر دسته
--  بخش 2: تابع چک‌این تازه checkin_v5 که عددها را از پروفایل دسته می‌خواند، با سقف روزانه دسته و سقف کل روز؛
--          do_checkin نسخه‌های قبل دست نخورده و تریگر نگهبان دسته‌های تازه را فقط به checkin_v5 می‌سپارد
--  بخش 3: برند، شعبه و کارکنان روی همان جدول businesses
--  بخش 4: واردات گزینش‌شده نانوایی، قنادی و فست‌فود؛ همه خاموش تا روز راه‌اندازی
--  بخش 5: ردیف نسخه v5.0 و تابع راه‌اندازی هر دسته
--
--  قاعده‌ها:
--   - هیچ حذف و هیچ دستور پاک کردنی در این فایل نیست
--   - نسخه‌های قبلی ظاهر فقط کافه و رستوران را می‌بینند؛ دسته‌های تازه فقط در v5.0
--   - دسته تازه تا وقتی مالک اپ آن را راه نیندازد خاموش است و چک‌این ندارد
-- ─────────────────────────────────────────────────────────────

-- ═════════ بخش 1: دسته‌ها و پروفایل رفتار ═════════

create table if not exists public.place_categories (
  key        text primary key check (key ~ '^[a-z_]{2,24}$'),
  parent     text references public.place_categories(key),
  label_fa   text not null,
  label_en   text not null,
  icon       text not null,
  sort       integer not null default 100,
  enabled    boolean not null default false,
  in_game    boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.category_profiles (
  category           text primary key references public.place_categories(key),
  xp_base            integer not null check (xp_base between 0 and 200),
  first_bonus        integer not null check (first_bonus between 0 and 100),
  daily_cap_xp       integer not null check (daily_cap_xp between 0 and 2000),
  clan_weight        numeric(3,2) not null default 1 check (clan_weight between 0 and 2),
  sensitivity        text not null default 'public' check (sensitivity in ('public', 'aggregate', 'hidden')),
  min_group          integer not null default 5 check (min_group between 1 and 100),
  presence_for_value smallint not null default 2 check (presence_for_value between 0 and 3),
  loyalty_days       integer not null default 4 check (loyalty_days between 1 and 30),
  updated_at         timestamptz not null default now()
);

alter table public.place_categories enable row level security;
alter table public.category_profiles enable row level security;
revoke all on public.place_categories, public.category_profiles from anon, authenticated;
grant select on public.place_categories, public.category_profiles to anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'place_categories' and policyname = 'read categories') then
    create policy "read categories" on public.place_categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'category_profiles' and policyname = 'read profiles') then
    create policy "read profiles" on public.category_profiles for select using (true);
  end if;
end $$;

-- سرشاخه‌ها
insert into public.place_categories (key, parent, label_fa, label_en, icon, sort, enabled, in_game) values
  ('drink',   null, 'نوشیدنی و کافه',   'Coffee and drinks', 'coffee',   10, true,  true),
  ('food',    null, 'غذا',              'Food',              'utensils', 20, true,  true),
  ('bread',   null, 'نان و شیرینی',     'Bread and sweets',  'bread',    30, false, true),
  ('culture', null, 'کتاب و فرهنگ',     'Books and culture', 'book',     40, false, true),
  ('sport',   null, 'ورزش',             'Sport',             'dumbbell', 50, false, true),
  ('beauty',  null, 'زیبایی',           'Beauty',            'scissors', 60, false, true),
  ('market',  null, 'بازارچه و رویداد', 'Markets and events','store',    70, false, true)
on conflict (key) do nothing;

-- برگ‌ها؛ کافه و رستوران همان دو دسته امروزی‌اند و روشن می‌مانند
insert into public.place_categories (key, parent, label_fa, label_en, icon, sort, enabled, in_game) values
  ('cafe',         'drink',   'کافه',           'Café',         'coffee',   11, true,  true),
  ('restaurant',   'food',    'رستوران',        'Restaurant',   'utensils', 21, true,  true),
  ('fast_food',    'food',    'فست‌فود',         'Fast food',    'burger',   22, false, true),
  ('bakery',       'bread',   'نانوایی',        'Bakery',       'bread',    31, false, true),
  ('pastry',       'bread',   'قنادی و شیرینی', 'Pastry shop',  'cake',     32, false, true),
  ('bookstore',    'culture', 'کتاب‌فروشی',      'Bookstore',    'book',     41, false, true),
  ('gym',          'sport',   'باشگاه',         'Gym',          'dumbbell', 51, false, true),
  ('beauty_salon', 'beauty',  'آرایشگاه',       'Beauty salon', 'scissors', 61, false, true),
  ('market_event', 'market',  'بازارچه',        'Market',       'store',    71, false, true)
on conflict (key) do nothing;

insert into public.category_profiles (category, xp_base, first_bonus, daily_cap_xp, clan_weight, sensitivity, min_group, presence_for_value, loyalty_days) values
  ('cafe',         50, 30, 500, 1.00, 'public',    5,  2, 4),
  ('restaurant',   50, 30, 160, 1.00, 'public',    5,  2, 2),
  ('fast_food',    30, 20,  60, 0.60, 'public',    5,  2, 3),
  ('bakery',       20, 20,  40, 0.50, 'public',    5,  2, 8),
  ('pastry',       30, 20,  60, 0.60, 'public',    5,  2, 4),
  ('bookstore',    40, 20, 120, 1.00, 'public',    5,  2, 3),
  ('gym',          30, 20,  30, 1.00, 'aggregate', 10, 2, 8),
  ('beauty_salon', 30, 20,  30, 0.80, 'aggregate', 10, 2, 2),
  ('market_event', 40, 20, 120, 1.00, 'public',    5,  2, 1)
on conflict (category) do nothing;

-- ستون نوع مکان به جدول دسته‌ها وصل می‌شود؛ مقدار خالی همان کافه است
update public.cafes set category = 'cafe' where category is null;
alter table public.cafes alter column category set default 'cafe';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cafes_category_fk') then
    alter table public.cafes add constraint cafes_category_fk foreign key (category) references public.place_categories(key);
  end if;
end $$;
create index if not exists cafes_category_active on public.cafes (category) where is_active;

-- ═════════ بخش 2: چک‌این با پروفایل دسته ═════════

-- سقف کل امتیاز چک‌این در یک روز تهران، از همه دسته‌ها با هم
create or replace function public.tl_daily_checkin_cap()
returns integer language sql immutable set search_path to '' as $$ select 600 $$;

-- ═════════ بخش 3: برند، شعبه، کارکنان ═════════

-- کد تصادفی امن از حروف و عددهای خوانا
create or replace function public.tl_rand_code(p_len integer)
returns text language sql volatile set search_path to '' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i - 1) % 32), 1), '' order by i)
    from (select extensions.gen_random_bytes(greatest(1, least(p_len, 32))) b) x, generate_series(1, greatest(1, least(p_len, 32))) i;
$$;
revoke all on function public.tl_rand_code(integer) from public, anon, authenticated;


create table if not exists public.orgs (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(name) between 2 and 60),
  created_by   uuid references public.profiles(id) on delete set null,
  status       text not null default 'active' check (status in ('active', 'suspended')),
  verify_level smallint not null default 0 check (verify_level between 0 and 2),
  created_at   timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id     bigint not null references public.orgs(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('owner', 'manager', 'staff')),
  is_active  boolean not null default true,
  added_by   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  left_at    timestamptz,
  primary key (org_id, user_id)
);
create index if not exists org_members_user on public.org_members (user_id) where is_active;

create table if not exists public.org_verifications (
  id          bigint generated always as identity primary key,
  org_id      bigint not null references public.orgs(id) on delete cascade,
  business_id bigint references public.businesses(id) on delete set null,
  method      text not null check (method in ('document', 'phone', 'video', 'visit')),
  level       smallint not null check (level between 1 and 2),
  note        text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.org_invites (
  code        text primary key,
  org_id      bigint not null references public.orgs(id) on delete cascade,
  business_id bigint not null references public.businesses(id) on delete cascade,
  role        text not null default 'staff' check (role in ('manager', 'staff')),
  created_by  uuid references public.profiles(id) on delete set null,
  expires_at  timestamptz not null,
  used_by     uuid references public.profiles(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.businesses add column if not exists org_id bigint references public.orgs(id) on delete set null;
create index if not exists businesses_org on public.businesses (org_id);

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.org_verifications enable row level security;
alter table public.org_invites enable row level security;
revoke all on public.orgs, public.org_members, public.org_verifications, public.org_invites from anon, authenticated;

-- هر کسب‌وکار تازه یک برند و یک صاحب می‌گیرد؛ شعبه‌های بعدی همان برند را می‌گیرند
create or replace function public.tl_business_org()
returns trigger language plpgsql security definer set search_path to '' as $$
declare v_org bigint; v_name text;
begin
  if new.org_id is null then
    select o.id into v_org from public.orgs o
      join public.org_members m on m.org_id = o.id and m.user_id = new.owner_id and m.role = 'owner' and m.is_active
     order by o.id limit 1;
    if v_org is null then
      select coalesce(nullif(c.brand, ''), c.name) into v_name from public.cafes c where c.id = new.cafe_id;
      insert into public.orgs (name, created_by) values (left(coalesce(v_name, 'کسب‌وکار'), 60), new.owner_id) returning id into v_org;
      insert into public.org_members (org_id, user_id, role, added_by) values (v_org, new.owner_id, 'owner', new.owner_id)
      on conflict (org_id, user_id) do nothing;
    end if;
    new.org_id := v_org;
  end if;
  return new;
end $$;
create or replace trigger businesses_org before insert on public.businesses
  for each row execute function public.tl_business_org();
revoke all on function public.tl_business_org() from public, anon, authenticated;

-- ردیف‌های قدیمی هم برند بگیرند
do $$ declare b record; v_org bigint; v_name text;
begin
  for b in select * from public.businesses where org_id is null loop
    select coalesce(nullif(c.brand, ''), c.name) into v_name from public.cafes c where c.id = b.cafe_id;
    insert into public.orgs (name, created_by) values (left(coalesce(v_name, 'کسب‌وکار'), 60), b.owner_id) returning id into v_org;
    insert into public.org_members (org_id, user_id, role, added_by) values (v_org, b.owner_id, 'owner', b.owner_id) on conflict do nothing;
    update public.businesses set org_id = v_org where id = b.id;
  end loop;
end $$;

create or replace function public.tl_works_at(p_user uuid, p_cafe uuid)
returns boolean language sql stable security definer set search_path to '' as $$
  select exists (
    select 1 from public.businesses b
      join public.org_members m on m.org_id = b.org_id and m.user_id = p_user and m.is_active
     where b.cafe_id = p_cafe and b.status = 'verified')
  or exists (select 1 from public.businesses b where b.cafe_id = p_cafe and b.owner_id = p_user and b.status = 'verified');
$$;
revoke all on function public.tl_works_at(uuid, uuid) from public, anon, authenticated;

-- نقش کاربر در شعبه: owner، manager، staff یا null
create or replace function public.tl_org_role(p_business bigint, p_user uuid default null)
returns text language sql stable security definer set search_path to '' as $$
  select case
    when b.owner_id = coalesce(p_user, auth.uid()) then 'owner'
    else (select m.role from public.org_members m where m.org_id = b.org_id and m.user_id = coalesce(p_user, auth.uid()) and m.is_active)
  end
  from public.businesses b where b.id = p_business and b.status = 'verified';
$$;
revoke all on function public.tl_org_role(bigint, uuid) from public, anon;
grant execute on function public.tl_org_role(bigint, uuid) to authenticated;

-- صاحب یا مدیر شعبه، یا مالک اپ
create or replace function public.owns_business(p_business_id bigint)
returns boolean language sql stable security definer set search_path to '' as $$
  select exists (
    select 1 from public.businesses b
     where b.id = p_business_id and b.status = 'verified'
       and (b.owner_id = (select auth.uid()) or public.is_app_owner()
            or exists (select 1 from public.org_members m where m.org_id = b.org_id and m.user_id = (select auth.uid())
                        and m.is_active and m.role in ('owner', 'manager'))));
$$;

-- کارمند هم حساب می‌شود؛ برای صفحه کد حضور و تأیید کوپن
create or replace function public.tl_staff_of(p_business bigint)
returns boolean language sql stable security definer set search_path to '' as $$
  select public.owns_business(p_business) or coalesce(public.tl_org_role(p_business) = 'staff', false);
$$;
revoke all on function public.tl_staff_of(bigint) from public, anon;
grant execute on function public.tl_staff_of(bigint) to authenticated;

-- کد دعوت کارمند: 8 حرف، 48 ساعت، یک‌بارمصرف
create or replace function public.org_staff_invite(p_business bigint, p_role text default 'staff')
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_org bigint; v_code text; v_open integer;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  if p_role not in ('manager', 'staff') then return jsonb_build_object('ok', false, 'error', 'bad_role'); end if;
  if p_role = 'manager' and coalesce(public.tl_org_role(p_business), '') <> 'owner' and not public.is_app_owner() then
    return jsonb_build_object('ok', false, 'error', 'owner_only'); end if;
  select org_id into v_org from public.businesses where id = p_business;
  select count(*) into v_open from public.org_invites where business_id = p_business and used_at is null and expires_at > now();
  if v_open >= 5 then return jsonb_build_object('ok', false, 'error', 'too_many'); end if;
  loop
    v_code := public.tl_rand_code(8);
    exit when not exists (select 1 from public.org_invites where code = v_code);
  end loop;
  insert into public.org_invites (code, org_id, business_id, role, created_by, expires_at)
  values (v_code, v_org, p_business, p_role, auth.uid(), now() + interval '48 hours');
  return jsonb_build_object('ok', true, 'code', v_code, 'expires_at', now() + interval '48 hours', 'role', p_role);
end $$;

create or replace function public.org_staff_join(p_code text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); r public.org_invites; v_name text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into r from public.org_invites where code = upper(btrim(coalesce(p_code, ''))) for update;
  if not found or r.used_at is not null or r.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'code'); end if;
  insert into public.org_members (org_id, user_id, role, added_by)
  values (r.org_id, v_uid, r.role, r.created_by)
  on conflict (org_id, user_id) do update set role = case when public.org_members.role = 'owner' then 'owner' else excluded.role end,
    is_active = true, left_at = null;
  update public.org_invites set used_by = v_uid, used_at = now() where code = r.code;
  select name into v_name from public.orgs where id = r.org_id;
  return jsonb_build_object('ok', true, 'org', v_name, 'role', r.role, 'business_id', r.business_id);
end $$;

create or replace function public.org_staff_list(p_business bigint)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare v_org bigint;
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select org_id into v_org from public.businesses where id = p_business;
  return jsonb_build_object('ok', true,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('id', m.user_id, 'card', public.tl_card(m.user_id), 'role', m.role, 'since', m.created_at) order by
                  case m.role when 'owner' then 0 when 'manager' then 1 else 2 end, m.created_at), '[]'::jsonb)
                  from public.org_members m where m.org_id = v_org and m.is_active),
    'invites', (select coalesce(jsonb_agg(jsonb_build_object('code', i.code, 'role', i.role, 'expires_at', i.expires_at) order by i.created_at desc), '[]'::jsonb)
                  from public.org_invites i where i.business_id = p_business and i.used_at is null and i.expires_at > now()));
end $$;

create or replace function public.org_staff_remove(p_business bigint, p_user uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_org bigint; v_role text;
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select org_id into v_org from public.businesses where id = p_business;
  select role into v_role from public.org_members where org_id = v_org and user_id = p_user and is_active;
  if v_role is null then return jsonb_build_object('ok', false, 'error', 'not_member'); end if;
  if v_role = 'owner' then return jsonb_build_object('ok', false, 'error', 'owner'); end if;
  if v_role = 'manager' and coalesce(public.tl_org_role(p_business), '') <> 'owner' and not public.is_app_owner() then
    return jsonb_build_object('ok', false, 'error', 'owner_only'); end if;
  update public.org_members set is_active = false, left_at = now() where org_id = v_org and user_id = p_user;
  return jsonb_build_object('ok', true);
end $$;

-- شعبه‌های من، برای انتخاب‌گر شعبه در پنل
create or replace function public.my_businesses()
returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'cafe_id', b.cafe_id, 'status', b.status, 'org_id', b.org_id, 'org', o.name,
           'role', public.tl_org_role(b.id), 'name', c.name, 'branch', c.branch, 'district', c.district, 'category', c.category) order by o.name, c.name), '[]'::jsonb)
    from public.businesses b
    join public.cafes c on c.id = b.cafe_id
    left join public.orgs o on o.id = b.org_id
   where b.status = 'verified'
     and (b.owner_id = auth.uid()
          or exists (select 1 from public.org_members m where m.org_id = b.org_id and m.user_id = auth.uid() and m.is_active));
$$;

revoke all on function public.org_staff_invite(bigint, text), public.org_staff_join(text), public.org_staff_list(bigint),
  public.org_staff_remove(bigint, uuid), public.my_businesses() from public, anon;
grant execute on function public.org_staff_invite(bigint, text), public.org_staff_join(text), public.org_staff_list(bigint),
  public.org_staff_remove(bigint, uuid), public.my_businesses() to authenticated;

-- ═════════ بخش 2، ادامه: تابع چک‌این نسخه v5.0 ═════════
-- تابع do_checkin نسخه‌های قبل دست نمی‌خورد. نسخه v5.0 تابع تازه checkin_v5 را صدا می‌زند.
-- این متن همان است که روی دیتابیس اجرا شد، با این فرق‌ها: نام checkin_v5، شناسه چک‌این در خروجی،
-- و نشانه tl.checkin_v5 هنگام نوشتن ردیف چک‌این تا تریگر نگهبان آن را بپذیرد.

create or replace function public.checkin_v5(p_cafe_id uuid, p_lat double precision default null, p_lng double precision default null, p_accuracy double precision default null)
returns json language plpgsql security definer set search_path to 'public'
as $function$
declare
  -- ── location rule ────────────────────────────────────────────────────────
  CHECKIN_RADIUS_M constant double precision := 200;
  REQUIRE_LOCATION constant boolean := true;    -- required since 2026-09-27: the app now sends location
  -- ── explore rules (2026-10-13) ───────────────────────────────────────────
  FIRST_BONUS_DAY  constant int := 4;           -- حداکثر چند پاداش «مکان تازه» در یک روز
  FIRST_BONUS_GAP  constant interval := interval '10 minutes';  -- فاصله از چک‌این قبلی برای پاداش مکان تازه
  MAX_SPEED_MS     constant double precision := 33.4;          -- حدود 120 کیلومتر در ساعت
  MIN_HOP_M        constant double precision := 2000;          -- زیر این فاصله سرعت سنجیده نمی‌شود
  -- ── v5.0: عددهای هر دسته از category_profiles ───────────────────────────
  v_cat      text;
  v_cat_on   boolean;
  v_cat_game boolean;
  v_cat_name text;
  v_base     int := 50;
  v_first    int := 30;
  v_cat_cap  int := 500;
  v_day_cat  int;
  v_day_all  int;
  v_xp_cap   text := null;
  v_clat   double precision;
  v_clng   double precision;
  v_dist   double precision;
  v_owner  boolean;
  v_prev_at  timestamptz;
  v_plat     double precision;
  v_plng     double precision;
  v_hop      double precision;
  v_bonus    boolean := false;
  v_capped   text := null;
  v_cell     text;
  v_new_cell boolean := false;
  v_miles    json := '[]'::json;
  v_uid    uuid := auth.uid();
  v_now    timestamptz := now();
  v_today  date := (v_now at time zone 'Asia/Tehran')::date;
  v_monday date := v_today - ((extract(isodow from v_today)::int) - 1);
  v_last   date;
  v_xp     int;
  v_coins  int;
  v_streak int;
  v_admin  boolean;
  v_is_new boolean;
  v_recent int;
  v_award  int;
  v_level  int;
  v_wk     int;
  v_wkstart date;
  v_district text;
  v_quests json := '[]'::json;
  v_rank   int;
  v_checkin uuid;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select district, lat, lng, coalesce(category, 'cafe') into v_district, v_clat, v_clng, v_cat
    from public.cafes where id = p_cafe_id and is_active;
  if not found then
    return json_build_object('ok', false, 'error', 'cafe_not_found');
  end if;

  v_owner := public.is_app_owner();

  -- ── دسته مکان: باید روشن و داخل بازی باشد؛ عددها از پروفایل دسته ─────────
  select pc.enabled, pc.in_game, pc.label_fa, coalesce(pr.xp_base, 50), coalesce(pr.first_bonus, 30), coalesce(pr.daily_cap_xp, 500)
    into v_cat_on, v_cat_game, v_cat_name, v_base, v_first, v_cat_cap
    from public.place_categories pc left join public.category_profiles pr on pr.category = pc.key
   where pc.key = v_cat;
  if not coalesce(v_cat_game, true) or (not coalesce(v_cat_on, true) and not v_owner) then
    return json_build_object('ok', false, 'error', 'category_closed',
      'message', 'این نوع مکان هنوز در بازی باز نشده است.');
  end if;

  -- ── حساب کسب‌وکار بازی نمی‌کند ───────────────────────────────────────────
  if not v_owner and exists (select 1 from public.profiles where id = v_uid and account_type = 'sme') then
    return json_build_object('ok', false, 'error', 'business_account',
      'message', 'حساب کسب‌وکار چک‌این ندارد. برای بازی با حساب کاربری وارد شو.');
  end if;

  -- ── کارکنان در محل کار خودشان چک‌این ندارند ─────────────────────────────
  if not v_owner and public.tl_works_at(v_uid, p_cafe_id) then
    return json_build_object('ok', false, 'error', 'own_workplace',
      'message', 'در محل کار خودت چک‌این حساب نمی‌شود.');
  end if;

  -- ── قانون موقعیت: باید واقعاً در کافه باشی — مالک اپ برای تست معاف است ──
  if not v_owner then
    if p_lat is null or p_lng is null then
      if REQUIRE_LOCATION then
        return json_build_object('ok', false, 'error', 'location_required',
          'message', 'برای چک‌این باید موقعیت مکانی‌ات را بفرستی.');
      end if;
    else
      if not (p_lat between -90 and 90) or not (p_lng between -180 and 180) then
        return json_build_object('ok', false, 'error', 'invalid_location');
      end if;
      if v_clat is null or v_clng is null then
        return json_build_object('ok', false, 'error', 'cafe_has_no_location');
      end if;
      v_dist := 2 * 6371008.8 * asin(sqrt(
                  power(sin(radians(p_lat - v_clat) / 2), 2)
                + cos(radians(v_clat)) * cos(radians(p_lat))
                * power(sin(radians(p_lng - v_clng) / 2), 2)));
      if v_dist > CHECKIN_RADIUS_M then
        return json_build_object('ok', false, 'error', 'too_far',
          'distance_m', round(v_dist)::int, 'radius_m', CHECKIN_RADIUS_M::int,
          'message', 'برای چک‌این باید داخل مکان یا نزدیکش باشی.');
      end if;
    end if;
  end if;

  select xp, coins, streak, last_checkin_date, is_admin, xp_weekly, week_start
    into v_xp, v_coins, v_streak, v_last, v_admin, v_wk, v_wkstart
    from public.profiles where id = v_uid for update;
  if not found then
    return json_build_object('ok', false, 'error', 'no_profile');
  end if;

  -- ── قانون: یک چک‌این در هر مکان، در هر روز تقویمی تهران ──────────────────
  select count(*) into v_recent
    from public.checkins
   where user_id = v_uid
     and cafe_id = p_cafe_id
     and (created_at at time zone 'Asia/Tehran')::date = v_today;
  if v_recent > 0 then
    return json_build_object(
      'ok', false,
      'error', 'cooldown',
      'message', 'امروز اینجا چک‌این کردی — فردا برگرد تا دوباره حساب بشه.',
      'next_at', ((v_today + 1)::timestamp at time zone 'Asia/Tehran')
    );
  end if;

  -- ── سفر ناممکن ───────────────────────────────────────────────────────────
  select c.created_at, f.lat, f.lng into v_prev_at, v_plat, v_plng
    from public.checkins c join public.cafes f on f.id = c.cafe_id
   where c.user_id = v_uid
   order by c.created_at desc
   limit 1;
  if not v_owner and v_prev_at is not null and v_plat is not null and v_clat is not null then
    v_hop := 2 * 6371008.8 * asin(sqrt(
               power(sin(radians(v_clat - v_plat) / 2), 2)
             + cos(radians(v_plat)) * cos(radians(v_clat))
             * power(sin(radians(v_clng - v_plng) / 2), 2)));
    if v_hop > MIN_HOP_M and v_hop / greatest(extract(epoch from (v_now - v_prev_at)), 1) > MAX_SPEED_MS then
      return json_build_object('ok', false, 'error', 'too_fast',
        'message', 'این چک‌این با چک‌این قبلی‌ات جور درنمی‌آید. کمی بعد دوباره امتحان کن.');
    end if;
  end if;

  v_is_new := not exists (
    select 1 from public.checkins where user_id = v_uid and cafe_id = p_cafe_id
  );

  -- ── پاداش مکان تازه، با سقف روزانه و فاصله زمانی ────────────────────────
  if v_is_new then
    if v_owner then
      v_bonus := true;
    elsif v_prev_at is not null and v_now - v_prev_at < FIRST_BONUS_GAP then
      v_capped := 'gap';
    elsif (select count(*) from public.xp_history
            where user_id = v_uid and reason = 'checkin_first'
              and (created_at at time zone 'Asia/Tehran')::date = v_today) >= FIRST_BONUS_DAY then
      v_capped := 'daily';
    else
      v_bonus := true;
    end if;
  end if;

  -- ── سلول تازه؟ ───────────────────────────────────────────────────────────
  if v_clat is not null and v_clng is not null then
    v_cell := public.tl_cell_key(v_clat, v_clng);
    v_new_cell := not exists (
      select 1 from public.checkins c left join public.cafes f on f.id = c.cafe_id
       where c.user_id = v_uid
         and coalesce(c.cell_key, case when f.lat is not null and f.lng is not null then public.tl_cell_key(f.lat, f.lng) end) = v_cell);
  end if;

  if v_last is null then v_streak := 1;
  elsif v_last = v_today then v_streak := v_streak;
  elsif v_last = v_today - 1 then v_streak := v_streak + 1;
  else v_streak := 1;
  end if;

  if v_wkstart is null or v_wkstart < v_monday then
    v_wk := 0; v_wkstart := v_monday;
  end if;

  v_award := v_base + (case when v_bonus then v_first else 0 end);

  -- ── v5.0: سقف روزانه این دسته و سقف کل روز؛ مالک اپ معاف است ─────────────
  if not v_owner then
    select coalesce(sum(c.xp_awarded), 0) into v_day_cat
      from public.checkins c join public.cafes f on f.id = c.cafe_id
     where c.user_id = v_uid and coalesce(f.category, 'cafe') = v_cat
       and (c.created_at at time zone 'Asia/Tehran')::date = v_today;
    select coalesce(sum(c.xp_awarded), 0) into v_day_all
      from public.checkins c
     where c.user_id = v_uid and (c.created_at at time zone 'Asia/Tehran')::date = v_today;
    if v_day_cat + v_award > v_cat_cap then
      v_award := greatest(v_cat_cap - v_day_cat, 0); v_xp_cap := 'category';
    end if;
    if v_day_all + v_award > public.tl_daily_checkin_cap() then
      v_award := greatest(public.tl_daily_checkin_cap() - v_day_all, 0); v_xp_cap := 'daily';
    end if;
    if v_award = 0 then v_bonus := false; end if;
  end if;

  v_xp    := v_xp + v_award;
  v_wk    := coalesce(v_wk,0) + v_award;
  v_coins := v_coins + case when v_award > 0 then 10 else 0 end;
  v_level := case
    when v_xp >= 2000 then 6 when v_xp >= 1000 then 5 when v_xp >= 600 then 4
    when v_xp >= 300 then 3 when v_xp >= 100 then 2 else 1 end;

  update public.profiles
     set xp = v_xp, coins = v_coins, streak = v_streak, level = v_level,
         xp_weekly = v_wk, week_start = v_wkstart,
         last_checkin_date = v_today, updated_at = now()
   where id = v_uid;

  perform set_config('tl.checkin_v5', '1', true);
  insert into public.checkins (user_id, cafe_id, xp_awarded, district)
  values (v_uid, p_cafe_id, v_award, v_district) returning id into v_checkin;
  perform set_config('tl.checkin_v5', '', true);

  select count(*) + 1 into v_rank from public.profiles where coalesce(xp,0) > v_xp;

  if v_award > 0 then
    insert into public.xp_history (user_id, amount, reason, ref_id, resulting_xp, rank_after)
    values (v_uid, v_award, case when v_bonus then 'checkin_first' else 'checkin' end, p_cafe_id, v_xp, v_rank);
  end if;

  begin
    select coalesce((public.quest_progress_checkin(v_uid, p_cafe_id))->'completed', '[]'::json) into v_quests;
  exception when undefined_function then v_quests := '[]'::json;
  end;

  begin
    perform public.sync_platform_collectibles(v_uid);
  exception when undefined_function then null;
  end;

  select coalesce(json_agg(json_build_object('district', district, 'pct', pct) order by pct), '[]'::json) into v_miles
    from public.explore_milestones where user_id = v_uid and reached_at = v_now;

  select xp, level into v_xp, v_level from public.profiles where id = v_uid;
  select count(*) + 1 into v_rank from public.profiles where coalesce(xp,0) > v_xp;

  return json_build_object('ok', true, 'xp', v_xp, 'level', v_level, 'checkin_id', v_checkin,
    'coins', v_coins, 'streak', v_streak, 'awarded', v_award, 'is_new_cafe', v_is_new,
    'first_bonus', v_bonus, 'bonus_capped', v_capped, 'xp_capped', v_xp_cap,
    'category', v_cat, 'category_label', v_cat_name,
    'cell_key', v_cell, 'new_cell', v_new_cell, 'milestones', v_miles,
    'district', v_district, 'completed_quests', v_quests, 'rank', v_rank);
end
$function$;
revoke all on function public.checkin_v5(uuid, double precision, double precision, double precision) from public, anon;
grant execute on function public.checkin_v5(uuid, double precision, double precision, double precision) to authenticated;

-- نسخه‌های قبل فقط در کافه و رستوران چک‌این می‌زنند؛ دسته‌های تازه فقط با تابع v5
create or replace function public.tl_checkin_category_guard()
returns trigger language plpgsql security definer set search_path to '' as $$
declare v_cat text;
begin
  select coalesce(category, 'cafe') into v_cat from public.cafes where id = new.cafe_id;
  if v_cat not in ('cafe', 'restaurant') and coalesce(current_setting('tl.checkin_v5', true), '') <> '1' then
    raise exception 'category_requires_v5' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.tl_checkin_category_guard() from public, anon, authenticated;
create or replace trigger checkins_category_guard before insert on public.checkins
  for each row execute function public.tl_checkin_category_guard();

-- وزن دسته در امتیاز کلن
create or replace function public.tl_clan_weight(p_cafe uuid)
returns numeric language sql stable security definer set search_path to '' as $$
  select coalesce((select pr.clan_weight from public.cafes c join public.category_profiles pr on pr.category = coalesce(c.category, 'cafe') where c.id = p_cafe), 1);
$$;
revoke all on function public.tl_clan_weight(uuid) from public, anon, authenticated;

do $$ declare d text;
begin
  select pg_get_functiondef('public.tl_clan_on_checkin()'::regprocedure) into d;
  if position('tl_clan_weight' in d) = 0 then
    d := replace(d, 'v_pts := greatest(coalesce(new.xp_awarded, new.xp_earned, 0), 0);',
                    'v_pts := greatest(round(coalesce(new.xp_awarded, new.xp_earned, 0) * public.tl_clan_weight(new.cafe_id))::integer, 0);');
    execute d;
  end if;
end $$;

-- ═════════ بخش 4: واردات گزینش‌شده نانوایی، قنادی و فست‌فود ═════════

create table if not exists public.sme_import_candidates (
  osm_id    text primary key,
  name      text,
  name_en   text,
  kind      text,
  category  text references public.place_categories(key),
  lat       double precision,
  lng       double precision,
  district  text,
  zone      text,
  phone     text,
  website   text,
  instagram text,
  opening_hours text,
  address   text,
  street    text,
  brand     text,
  branch    text,
  final_name text,
  decision  text,
  cafe_id   uuid,
  created_at timestamptz not null default now()
);
alter table public.sme_import_candidates enable row level security;
revoke all on public.sme_import_candidates from anon, authenticated;

insert into public.sme_import_candidates (osm_id, name, name_en, kind, category, lat, lng, phone, website, opening_hours, address, street)
select r.osm_id, btrim(r.tags->>'name'), nullif(btrim(r.tags->>'name:en'), ''),
       coalesce(r.tags->>'shop', r.tags->>'amenity'),
       case when r.tags->>'shop' = 'bakery' then 'bakery'
            when r.tags->>'shop' in ('confectionery', 'pastry') then 'pastry'
            when r.tags->>'amenity' = 'fast_food' then 'fast_food' end,
       r.lat, r.lng,
       nullif(btrim(coalesce(r.tags->>'phone', r.tags->>'contact:phone')), ''),
       nullif(btrim(coalesce(r.tags->>'website', r.tags->>'contact:website')), ''),
       nullif(btrim(r.tags->>'opening_hours'), ''),
       nullif(btrim(concat_ws('، ', r.tags->>'addr:street', r.tags->>'addr:housenumber')), ''),
       nullif(btrim(r.tags->>'addr:street'), '')
  from public.osm2_raw r
 where (r.tags->>'shop' in ('bakery', 'confectionery', 'pastry') or r.tags->>'amenity' = 'fast_food')
   and r.lat is not null and r.lng is not null
on conflict (osm_id) do nothing;

-- منطقه و پهنه
update public.sme_import_candidates s
   set district = 'منطقه ' || d.region_num
  from public.districts d
 where s.district is null and st_contains(d.geom, st_setsrid(st_makepoint(s.lng, s.lat), 4326));

with modes as (
  select distinct on (district) district, zone from public.cafes where district is not null and zone is not null
   group by district, zone order by district, count(*) desc)
update public.sme_import_candidates s set zone = m.zone from modes m where s.zone is null and s.district = m.district;

update public.sme_import_candidates set instagram = website, website = null
 where website ilike '%instagram.com%' and instagram is null;

-- تصمیم‌ها، به ترتیب
update public.sme_import_candidates set decision = 'skip_no_name' where decision is null and coalesce(name, '') = '';
update public.sme_import_candidates set decision = 'skip_outside_tehran' where decision is null and district is null;
update public.sme_import_candidates set decision = 'skip_generic_name'
 where decision is null and regexp_replace(name, '[\s‌]+', '', 'g') in
   ('نانوایی', 'نان', 'نانوایی‌سنگک', 'نانواییسنگک', 'نانواییبربری', 'نانواییلواش', 'نانواییتافتون', 'شیرینی', 'شیرینیفروشی', 'قنادی',
    'فستفود', 'ساندویچ', 'ساندویچی', 'اغذیه', 'اغذیهفروشی', 'پیتزا', 'برگر', 'bakery', 'Bakery', 'fastfood', 'FastFood');
-- داخل بیمارستان، دانشگاه، اداره، نظامی و مانند آن نه؛ داخل مرکز خرید بله
update public.sme_import_candidates s set decision = 'skip_inside_institution'
 where decision is null and exists (
   select 1 from public.osm2_areas a
    where a.kind in ('hospital', 'university', 'college', 'government', 'military', 'police', 'prison', 'courthouse', 'townhall', 'diplomatic', 'bunker', 'research_institute')
      and st_contains(a.geom, st_setsrid(st_makepoint(s.lng, s.lat), 4326)));
-- تکراری با مکان‌های موجود: همان نام در 40 متری
update public.sme_import_candidates s set decision = 'skip_duplicate_of_existing'
 where decision is null and exists (
   select 1 from public.cafes c
    where c.lat is not null and abs(c.lat - s.lat) < 0.001 and abs(c.lng - s.lng) < 0.001
      and st_dwithin(geography(st_makepoint(c.lng, c.lat)), geography(st_makepoint(s.lng, s.lat)), 40)
      and regexp_replace(c.name, '[\s‌]+', '', 'g') = regexp_replace(s.name, '[\s‌]+', '', 'g'));
-- تکراری داخل خود داده: همان نام در 40 متری، اولی می‌ماند
update public.sme_import_candidates s set decision = 'skip_duplicate_in_osm'
 where decision is null and exists (
   select 1 from public.sme_import_candidates t
    where t.osm_id < s.osm_id and t.decision is null
      and regexp_replace(t.name, '[\s‌]+', '', 'g') = regexp_replace(s.name, '[\s‌]+', '', 'g')
      and st_dwithin(geography(st_makepoint(t.lng, t.lat)), geography(st_makepoint(s.lng, s.lat)), 40));
update public.sme_import_candidates set decision = 'import' where decision is null;

-- نام یکتا: نام تکراری مثل شعبه‌های یک برند به شکل «برند · خیابان» نوشته می‌شود، مثل شعبه‌های کافه‌ها
update public.sme_import_candidates s set brand = s.name, branch = coalesce(s.street, s.district)
 where s.decision = 'import' and (
   exists (select 1 from public.sme_import_candidates t where t.decision = 'import' and t.osm_id <> s.osm_id and t.name = s.name)
   or exists (select 1 from public.cafes c where c.name = s.name));
update public.sme_import_candidates set final_name = case when branch is not null then name || ' · ' || branch else name end
 where decision = 'import';
with d as (select osm_id, row_number() over (partition by final_name order by osm_id) rn from public.sme_import_candidates where decision = 'import')
update public.sme_import_candidates s set final_name = s.final_name || ' ' || d.rn from d where d.osm_id = s.osm_id and d.rn > 1;
update public.sme_import_candidates s set decision = 'skip_name_taken'
 where s.decision = 'import' and exists (select 1 from public.cafes c where c.name = s.final_name);

-- ورود به جدول مکان، خاموش تا روز راه‌اندازی دسته
with ins as (
  insert into public.cafes (name, name_en, brand, branch, lat, lng, zone, district, category, is_active, hidden_reason, source, osm_id, phone, website, instagram, opening_hours, address, tier)
  select s.final_name, s.name_en, s.brand, s.branch, s.lat, s.lng, coalesce(s.zone, 'center'), s.district, s.category, false, 'sme_pending', 'osm', s.osm_id,
         s.phone, s.website, s.instagram, s.opening_hours, s.address,
         case when s.phone is not null or s.website is not null or s.instagram is not null or s.opening_hours is not null then 'standard' else 'minor' end
    from public.sme_import_candidates s
   where s.decision = 'import' and s.cafe_id is null
     and not exists (select 1 from public.cafes c where c.osm_id = s.osm_id)
  on conflict (name) do nothing
  returning id, osm_id)
update public.sme_import_candidates s set cafe_id = ins.id from ins where s.osm_id = ins.osm_id;

-- ═════════ بخش 5: نسخه v5.0 و راه‌اندازی دسته ═════════

insert into public.ui_versions (id, seq, name, released_on, notes)
values ('v5.0', 50, 'کسب‌وکارها', '2026-10-27',
        'نسخه پنجم: همان v4.0 به‌علاوه نوع‌های تازه کسب‌وکار با آیکون نوع و فیلتر، همکاری قراردادی بین کسب‌وکارها با مسیر مشترک و کوپن متقابل، کد چرخان حضور، و پیوند همکاری با کلن')
on conflict (id) do nothing;

-- فقط مالک اپ: یک دسته را روشن می‌کند و مکان‌های منتظرش را روی نقشه می‌آورد
create or replace function public.sme_launch_category(p_key text, p_on boolean default true)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_n integer := 0;
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  if not exists (select 1 from public.place_categories where key = p_key and parent is not null) then
    return jsonb_build_object('ok', false, 'error', 'bad_category'); end if;
  update public.place_categories set enabled = p_on where key = p_key;
  update public.place_categories p set enabled = true where p_on and p.key = (select parent from public.place_categories where key = p_key);
  if p_on then
    update public.cafes set is_active = true, hidden_reason = null where category = p_key and hidden_reason = 'sme_pending';
    get diagnostics v_n = row_count;
  else
    update public.cafes set is_active = false, hidden_reason = 'sme_pending' where category = p_key and is_active and source = 'osm'
       and osm_id in (select osm_id from public.sme_import_candidates where category = p_key);
    get diagnostics v_n = row_count;
  end if;
  return jsonb_build_object('ok', true, 'category', p_key, 'enabled', p_on, 'places', v_n);
end $$;
revoke all on function public.sme_launch_category(text, boolean) from public, anon;
grant execute on function public.sme_launch_category(text, boolean) to authenticated;

-- وضعیت دسته‌ها برای پنل ادمین
create or replace function public.sme_category_status()
returns jsonb language sql stable security definer set search_path to '' as $$
  select case when not public.is_app_owner() then jsonb_build_object('ok', false, 'error', 'not_allowed') else
    jsonb_build_object('ok', true, 'list', (
      select coalesce(jsonb_agg(jsonb_build_object('key', p.key, 'label', p.label_fa, 'icon', p.icon, 'enabled', p.enabled,
               'active', (select count(*) from public.cafes c where c.category = p.key and c.is_active),
               'pending', (select count(*) from public.cafes c where c.category = p.key and c.hidden_reason = 'sme_pending')) order by p.sort), '[]'::jsonb)
        from public.place_categories p where p.parent is not null)) end;
$$;
revoke all on function public.sme_category_status() from public, anon;
grant execute on function public.sme_category_status() to authenticated;
