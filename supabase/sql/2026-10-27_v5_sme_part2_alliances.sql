-- TwinLand نسخه v5.0، بخش دوم: همکاری کسب‌وکارها، کد حضور، کوپن، مسیر کلن
-- 27 اکتبر 2026. سند طراحی: claude/TwinLand_SME_Expansion_Design.md
-- قاعده‌ها: همه جدول‌ها بسته‌اند و نوشتن فقط با تابع امن است. تابع do_checkin نسخه‌های قبل دست نمی‌خورد.
-- این فایل همان است که روی دیتابیس اجرا شد، به ترتیب بخش‌ها.

-- ═════════ بخش 6: جدول‌ها ═════════

create table if not exists public.alliances (
  id                bigint generated always as identity primary key,
  kind              text not null check (kind in ('trail', 'bounceback', 'event', 'clan_sponsor')),
  title             text not null check (char_length(title) between 3 and 60),
  blurb             text check (blurb is null or char_length(blurb) <= 200),
  status            text not null default 'proposed' check (status in ('draft', 'proposed', 'countered', 'accepted', 'scheduled', 'active', 'paused', 'ended', 'declined', 'withdrawn', 'expired')),
  tier              text not null default 'walk' check (tier in ('walk', 'area', 'city')),
  window_hours      integer not null default 4 check (window_hours between 1 and 2160),
  required_steps    smallint check (required_steps is null or required_steps between 1 and 5),
  starts_at         timestamptz not null default now(),
  ends_at           timestamptz not null,
  terms_version     integer not null default 1,
  is_platform       boolean not null default false,
  proposer_business bigint references public.businesses(id) on delete set null,
  created_by        uuid references public.profiles(id) on delete set null,
  step_xp           integer not null default 10 check (step_xp between 0 and 30),
  xp_reward         integer not null default 40 check (xp_reward between 0 and 200),
  clan_bonus        integer not null default 40 check (clan_bonus between 0 and 100),
  coupon_days       integer not null default 14 check (coupon_days between 1 and 60),
  require_presence  boolean not null default false,
  paused_at         timestamptz,
  pause_reason      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists alliances_status on public.alliances (status, ends_at);
create index if not exists alliances_proposer on public.alliances (proposer_business, created_at desc);

create table if not exists public.alliance_parties (
  alliance_id      bigint not null references public.alliances(id) on delete cascade,
  cafe_id          uuid not null references public.cafes(id) on delete cascade,
  business_id      bigint references public.businesses(id) on delete set null,
  role             text not null default 'partner' check (role in ('proposer', 'partner')),
  reward_label     text check (reward_label is null or char_length(reward_label) between 2 and 80),
  budget_total     integer check (budget_total is null or budget_total between 1 and 10000),
  budget_daily     integer check (budget_daily is null or budget_daily between 1 and 1000),
  issued           integer not null default 0,
  redeemed         integer not null default 0,
  accepted_version integer,
  accepted_at      timestamptz,
  accepted_by      uuid references public.profiles(id) on delete set null,
  primary key (alliance_id, cafe_id)
);
create index if not exists alliance_parties_business on public.alliance_parties (business_id);
create index if not exists alliance_parties_cafe on public.alliance_parties (cafe_id);

create table if not exists public.alliance_steps (
  alliance_id bigint not null references public.alliances(id) on delete cascade,
  seq         smallint not null check (seq between 1 and 5),
  cafe_id     uuid not null references public.cafes(id) on delete cascade,
  primary key (alliance_id, seq),
  unique (alliance_id, cafe_id)
);
create index if not exists alliance_steps_cafe on public.alliance_steps (cafe_id);

create table if not exists public.alliance_terms (
  alliance_id bigint not null references public.alliances(id) on delete cascade,
  version     integer not null,
  body        jsonb not null,
  hash        text not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (alliance_id, version)
);

create table if not exists public.alliance_events (
  id          bigint generated always as identity primary key,
  alliance_id bigint not null references public.alliances(id) on delete cascade,
  actor       uuid references public.profiles(id) on delete set null,
  business_id bigint references public.businesses(id) on delete set null,
  kind        text not null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists alliance_events_alliance on public.alliance_events (alliance_id, created_at desc);

create table if not exists public.alliance_progress (
  id           bigint generated always as identity primary key,
  alliance_id  bigint not null references public.alliances(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'active' check (status in ('active', 'done', 'expired')),
  steps_done   smallint[] not null default '{}',
  started_at   timestamptz not null default now(),
  deadline     timestamptz not null,
  completed_at timestamptz,
  updated_at   timestamptz not null default now()
);
create unique index if not exists alliance_progress_one_active on public.alliance_progress (alliance_id, user_id) where status = 'active';
create unique index if not exists alliance_progress_one_done on public.alliance_progress (alliance_id, user_id) where status = 'done';
create index if not exists alliance_progress_user on public.alliance_progress (user_id, status);

create table if not exists public.alliance_coupons (
  id           bigint generated always as identity primary key,
  alliance_id  bigint not null references public.alliances(id) on delete cascade,
  cafe_id      uuid not null references public.cafes(id) on delete cascade,
  business_id  bigint references public.businesses(id) on delete set null,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  period_key   text not null,
  code         text not null unique,
  reward_label text not null,
  status       text not null default 'issued' check (status in ('pending_proof', 'issued', 'redeemed', 'expired', 'void')),
  issued_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  redeemed_at  timestamptz,
  redeemed_by  uuid references public.profiles(id) on delete set null,
  unique (alliance_id, cafe_id, user_id, period_key)
);
create index if not exists alliance_coupons_user on public.alliance_coupons (user_id, status);
create index if not exists alliance_coupons_business on public.alliance_coupons (business_id, status);

-- امتیاز کلن از مسیر؛ جدا از clan_contrib تا شمارش صندوق هفته و پرچم منطقه عوض نشود
create table if not exists public.clan_trail_points (
  alliance_id bigint not null references public.alliances(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  clan_id     bigint not null references public.clans(id) on delete cascade,
  points      integer not null,
  week_start  date not null,
  created_at  timestamptz not null default now(),
  primary key (alliance_id, user_id)
);

-- جفت مکان‌ها با مشتری مشترک؛ هر شب از نو حساب می‌شود و ردیف کهنه shared صفر می‌گیرد
create table if not exists public.place_affinity (
  cafe_a      uuid not null references public.cafes(id) on delete cascade,
  cafe_b      uuid not null references public.cafes(id) on delete cascade,
  shared      integer not null default 0,
  lift        numeric(10,2),
  distance_m  integer,
  tier        text,
  computed_at timestamptz not null default now(),
  primary key (cafe_a, cafe_b),
  check (cafe_a < cafe_b)
);
create index if not exists place_affinity_b on public.place_affinity (cafe_b);

-- دستگاه مغازه برای کد چرخان؛ راز را هیچ نقشی نمی‌خواند
create table if not exists public.org_devices (
  id          bigint generated always as identity primary key,
  business_id bigint not null references public.businesses(id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 40),
  secret      bytea not null default extensions.gen_random_bytes(20),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index if not exists org_devices_business on public.org_devices (business_id) where revoked_at is null;

create table if not exists public.presence_proofs (
  id         bigint generated always as identity primary key,
  checkin_id uuid references public.checkins(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  cafe_id    uuid not null references public.cafes(id) on delete cascade,
  level      smallint not null check (level between 0 and 3),
  method     text not null check (method in ('gps', 'code', 'staff', 'nfc')),
  device_id  bigint references public.org_devices(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (checkin_id, method)
);
create index if not exists presence_proofs_user on public.presence_proofs (user_id, created_at desc);

create table if not exists public.presence_attempts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  cafe_id    uuid references public.cafes(id) on delete cascade,
  ok         boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists presence_attempts_user on public.presence_attempts (user_id, created_at desc);

-- کلید تکرارناپذیر: یک کار با یک کلید دو بار انجام نمی‌شود و همان جواب اول برمی‌گردد
create table if not exists public.op_keys (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  key        text not null check (char_length(key) between 8 and 64),
  fn         text not null,
  result     jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.alliances enable row level security;
alter table public.alliance_parties enable row level security;
alter table public.alliance_steps enable row level security;
alter table public.alliance_terms enable row level security;
alter table public.alliance_events enable row level security;
alter table public.alliance_progress enable row level security;
alter table public.alliance_coupons enable row level security;
alter table public.clan_trail_points enable row level security;
alter table public.place_affinity enable row level security;
alter table public.org_devices enable row level security;
alter table public.presence_proofs enable row level security;
alter table public.presence_attempts enable row level security;
alter table public.op_keys enable row level security;
revoke all on public.alliances, public.alliance_parties, public.alliance_steps, public.alliance_terms, public.alliance_events,
  public.alliance_progress, public.alliance_coupons, public.clan_trail_points, public.place_affinity, public.org_devices,
  public.presence_proofs, public.presence_attempts, public.op_keys from anon, authenticated;

-- ═════════ بخش 7: کمکی‌ها ═════════

create or replace function public.tl_dist_m(a_lat double precision, a_lng double precision, b_lat double precision, b_lng double precision)
returns double precision language sql immutable set search_path to '' as $$
  select case when a_lat is null or a_lng is null or b_lat is null or b_lng is null then null else
    2 * 6371008.8 * asin(least(1, sqrt(power(sin(radians(b_lat - a_lat) / 2), 2)
      + cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lng - a_lng) / 2), 2)))) end
$$;

-- دقیقه پیاده با ضریب پیچ‌وخم 1.3 و سرعت 80 متر در دقیقه
create or replace function public.tl_walk_min(p_m double precision)
returns integer language sql immutable set search_path to '' as $$
  select case when p_m is null then null else greatest(1, ceil(p_m * 1.3 / 80))::integer end
$$;

create or replace function public.tl_dist_tier(p_m double precision)
returns text language sql immutable set search_path to '' as $$
  select case when coalesce(p_m, 0) <= 600 then 'walk' when p_m <= 3000 then 'area' else 'city' end
$$;

-- بازه تمام کردن مسیر: پیاده 4 ساعت، محله یک هفته، شهر 30 روز
create or replace function public.tl_tier_window(p_tier text)
returns integer language sql immutable set search_path to '' as $$
  select case p_tier when 'walk' then 4 when 'area' then 168 else 720 end
$$;

create or replace function public.tl_alliance_kind_fa(p_kind text)
returns text language sql immutable set search_path to '' as $$
  select case p_kind when 'trail' then 'مسیر مشترک' when 'bounceback' then 'بازگشت متقابل'
    when 'event' then 'رویداد مشترک' when 'clan_sponsor' then 'حامی کلن' else 'همکاری' end
$$;

create or replace function public.tl_cat_root(p_cat text)
returns text language sql stable set search_path to '' as $$
  select coalesce((select coalesce(pc.parent, pc.key) from public.place_categories pc where pc.key = coalesce(p_cat, 'cafe')), 'drink')
$$;

-- مکمل بودن دو دسته، از 0.2 برای هم‌دسته تا 1 برای جفت‌های خوب
create or replace function public.tl_cat_complement(p_a text, p_b text)
returns numeric language sql stable set search_path to '' as $$
  with r as (select public.tl_cat_root(p_a) a, public.tl_cat_root(p_b) b)
  select case
    when coalesce(p_a, 'cafe') = coalesce(p_b, 'cafe') then 0.2
    when r.a = r.b then 0.5
    else coalesce((select v from (values
      ('culture+drink', 1.0), ('bread+drink', 1.0), ('drink+food', 0.8), ('food+sport', 0.9), ('drink+sport', 0.8),
      ('beauty+drink', 0.8), ('drink+market', 0.9), ('food+market', 0.8), ('bread+food', 0.6), ('beauty+sport', 0.7),
      ('culture+food', 0.7), ('bread+culture', 0.7), ('bread+market', 0.8), ('culture+market', 0.9)) t(k, v)
      where t.k = least(r.a, r.b) || '+' || greatest(r.a, r.b)), 0.6)
  end from r
$$;

create or replace function public.tl_op_get(p_key text)
returns jsonb language sql stable security definer set search_path to '' as $$
  select o.result from public.op_keys o where o.user_id = auth.uid() and o.key = p_key
$$;

create or replace function public.tl_op_put(p_key text, p_fn text, p_result jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if p_key is not null and auth.uid() is not null and char_length(p_key) between 8 and 64 and coalesce((p_result->>'ok')::boolean, false) then
    insert into public.op_keys (user_id, key, fn, result) values (auth.uid(), p_key, p_fn, p_result) on conflict do nothing;
  end if;
  return p_result;
end $$;

create or replace function public.tl_alliance_log(p_alliance bigint, p_business bigint, p_kind text, p_data jsonb default '{}'::jsonb)
returns void language sql security definer set search_path to '' as $$
  insert into public.alliance_events (alliance_id, actor, business_id, kind, data)
  values (p_alliance, auth.uid(), p_business, p_kind, coalesce(p_data, '{}'::jsonb))
$$;

-- سند ثابت شرایط هر نسخه با چکیده
create or replace function public.tl_alliance_snapshot(p_alliance bigint)
returns void language plpgsql security definer set search_path to '' as $$
declare a public.alliances; v jsonb;
begin
  select * into a from public.alliances where id = p_alliance;
  if not found then return; end if;
  v := jsonb_build_object('kind', a.kind, 'title', a.title, 'blurb', a.blurb, 'tier', a.tier, 'window_hours', a.window_hours,
    'required_steps', a.required_steps, 'starts_at', a.starts_at, 'ends_at', a.ends_at, 'require_presence', a.require_presence,
    'coupon_days', a.coupon_days, 'xp_reward', a.xp_reward, 'step_xp', a.step_xp, 'clan_bonus', a.clan_bonus,
    'parties', (select coalesce(jsonb_agg(jsonb_build_object('cafe_id', p.cafe_id, 'business_id', p.business_id, 'reward', p.reward_label,
                  'budget_total', p.budget_total, 'budget_daily', p.budget_daily) order by p.cafe_id), '[]'::jsonb)
                  from public.alliance_parties p where p.alliance_id = a.id),
    'steps', (select coalesce(jsonb_agg(jsonb_build_object('seq', s.seq, 'cafe_id', s.cafe_id) order by s.seq), '[]'::jsonb)
                from public.alliance_steps s where s.alliance_id = a.id));
  insert into public.alliance_terms (alliance_id, version, body, hash, created_by)
  values (a.id, a.terms_version, v, encode(extensions.digest(v::text, 'sha256'), 'hex'), auth.uid())
  on conflict (alliance_id, version) do update set body = excluded.body, hash = excluded.hash;
end $$;

-- خبر به صاحب و مدیرهای هر طرف، جز طرفی که خودش کار را کرده
create or replace function public.tl_alliance_notify(p_alliance bigint, p_except bigint, p_type text, p_title text, p_body text)
returns void language plpgsql security definer set search_path to '' as $$
declare r record;
begin
  for r in
    select distinct x.uid from (
      select b.owner_id uid from public.alliance_parties p join public.businesses b on b.id = p.business_id
       where p.alliance_id = p_alliance and p.business_id is distinct from p_except
      union
      select m.user_id from public.alliance_parties p join public.businesses b on b.id = p.business_id
        join public.org_members m on m.org_id = b.org_id and m.is_active and m.role in ('owner', 'manager')
       where p.alliance_id = p_alliance and p.business_id is distinct from p_except) x
     where x.uid is not null
  loop
    perform public.push_notification(r.uid, p_type, p_title, p_body, '🤝', '/business?tab=alliances');
  end loop;
end $$;

-- چه چیزی جلوی فعال ماندن همکاری را گرفته
create or replace function public.tl_alliance_problem(p_alliance bigint)
returns text language sql stable security definer set search_path to '' as $$
  select case
    when exists (select 1 from public.alliance_parties p left join public.businesses b on b.id = p.business_id
                  where p.alliance_id = p_alliance and p.business_id is not null and (b.id is null or b.status <> 'verified')) then 'business_unverified'
    when exists (select 1 from public.alliance_parties p join public.cafes c on c.id = p.cafe_id where p.alliance_id = p_alliance and not c.is_active)
      or exists (select 1 from public.alliance_steps s join public.cafes c on c.id = s.cafe_id where s.alliance_id = p_alliance and not c.is_active) then 'place_closed'
    when exists (select 1 from public.alliance_parties p where p.alliance_id = p_alliance and p.reward_label is not null
                  and p.budget_total is not null and p.issued >= p.budget_total) then 'budget'
    else null end
$$;

create or replace function public.tl_pause_reason_fa(p_reason text)
returns text language sql immutable set search_path to '' as $$
  select case split_part(coalesce(p_reason, ''), ':', 1)
    when 'budget' then 'بودجه جایزه یکی از طرف‌ها تمام شد'
    when 'place_closed' then 'یکی از مکان‌ها بسته یا پنهان شد'
    when 'business_unverified' then 'احراز یکی از طرف‌ها برداشته شد'
    when 'manual' then 'یکی از طرف‌ها آن را نگه داشت'
    else 'متوقف شد' end
$$;

create or replace function public.tl_alliance_pause(p_alliance bigint, p_reason text, p_business bigint)
returns boolean language plpgsql security definer set search_path to '' as $$
declare v_title text;
begin
  update public.alliances set status = 'paused', paused_at = now(), pause_reason = p_reason, updated_at = now()
   where id = p_alliance and status in ('active', 'scheduled') returning title into v_title;
  if v_title is null then return false; end if;
  perform public.tl_alliance_log(p_alliance, p_business, 'paused', jsonb_build_object('reason', p_reason));
  perform public.tl_alliance_notify(p_alliance, p_business, 'alliance_paused', 'همکاری «' || v_title || '» متوقف شد',
    public.tl_pause_reason_fa(p_reason) || '. پیشرفت کاربرانی که وسط راه‌اند نگه داشته می‌شود.');
  return true;
end $$;

-- کارهای زمان‌دار، حداکثر یک بار در دقیقه، از داخل تابع‌های فهرست و چک‌این
create or replace function public.tl_alliance_sweep(p_force boolean default false)
returns void language plpgsql security definer set search_path to '' as $$
declare v_last timestamptz; r record; v_problem text;
begin
  select nullif(value, '')::timestamptz into v_last from public.app_settings where key = 'alliance_sweep_at';
  if not coalesce(p_force, false) and v_last is not null and v_last > now() - interval '60 seconds' then return; end if;
  insert into public.app_settings (key, value, updated_at) values ('alliance_sweep_at', now()::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  for r in update public.alliances set status = 'expired', updated_at = now()
            where status in ('proposed', 'countered') and updated_at < now() - interval '7 days' returning id, title loop
    perform public.tl_alliance_log(r.id, null, 'expired', '{}'::jsonb);
    perform public.tl_alliance_notify(r.id, null, 'alliance_expired', 'پیشنهاد «' || r.title || '» منقضی شد', 'هفت روز بی‌جواب ماند.');
  end loop;
  for r in update public.alliances set status = 'active', updated_at = now()
            where status = 'scheduled' and starts_at <= now() and ends_at > now() returning id, title loop
    perform public.tl_alliance_log(r.id, null, 'started', '{}'::jsonb);
    perform public.tl_alliance_notify(r.id, null, 'alliance_started', 'همکاری «' || r.title || '» شروع شد', 'از همین حالا برای کاربران دیده می‌شود.');
  end loop;
  for r in update public.alliances set status = 'ended', updated_at = now()
            where status in ('scheduled', 'active', 'paused') and ends_at <= now() returning id, title loop
    perform public.tl_alliance_log(r.id, null, 'ended', jsonb_build_object('auto', true));
    perform public.tl_alliance_notify(r.id, null, 'alliance_ended', 'همکاری «' || r.title || '» تمام شد', 'نتیجه را در زبانه همکاری ببین.');
  end loop;
  update public.alliance_progress set status = 'expired', updated_at = now() where status = 'active' and deadline < now();
  update public.alliance_coupons set status = 'expired' where status in ('issued', 'pending_proof') and expires_at < now();
  for r in select id from public.alliances where status in ('active', 'scheduled') loop
    v_problem := public.tl_alliance_problem(r.id);
    if v_problem is not null then perform public.tl_alliance_pause(r.id, v_problem, null); end if;
  end loop;
end $$;

-- ساختن کوپن یک طرف برای یک کاربر، با سقف کل و روزانه و توقف خودکار
create or replace function public.tl_alliance_issue(p_alliance bigint, p_cafe uuid, p_user uuid, p_period text)
returns text language plpgsql security definer set search_path to '' as $$
declare a public.alliances; p public.alliance_parties; v_today integer; v_code text; v_status text; v_name text;
begin
  select * into a from public.alliances where id = p_alliance;
  select * into p from public.alliance_parties where alliance_id = p_alliance and cafe_id = p_cafe for update;
  if not found or p.reward_label is null then return 'no_reward'; end if;
  if exists (select 1 from public.alliance_coupons where alliance_id = p_alliance and cafe_id = p_cafe and user_id = p_user and period_key = p_period) then
    return 'exists';
  end if;
  if p.budget_total is not null and p.issued >= p.budget_total then
    perform public.tl_alliance_pause(p_alliance, 'budget', null);
    return 'budget';
  end if;
  if p.budget_daily is not null then
    select count(*) into v_today from public.alliance_coupons
     where alliance_id = p_alliance and cafe_id = p_cafe
       and (issued_at at time zone 'Asia/Tehran')::date = (now() at time zone 'Asia/Tehran')::date;
    if v_today >= p.budget_daily then return 'daily_full'; end if;
  end if;
  v_status := case when a.require_presence and not exists (
      select 1 from public.presence_proofs pp
       where pp.user_id = p_user and pp.level >= 2 and pp.created_at >= a.starts_at
         and (pp.cafe_id in (select s.cafe_id from public.alliance_steps s where s.alliance_id = a.id)
           or pp.cafe_id in (select q.cafe_id from public.alliance_parties q where q.alliance_id = a.id)))
    then 'pending_proof' else 'issued' end;
  loop
    v_code := 'T' || public.tl_rand_code(7);
    exit when not exists (select 1 from public.alliance_coupons where code = v_code)
          and not exists (select 1 from public.redemptions where code = v_code);
  end loop;
  insert into public.alliance_coupons (alliance_id, cafe_id, business_id, user_id, period_key, code, reward_label, status, expires_at)
  values (p_alliance, p_cafe, p.business_id, p_user, p_period, v_code, p.reward_label, v_status, now() + make_interval(days => a.coupon_days));
  update public.alliance_parties set issued = issued + 1 where alliance_id = p_alliance and cafe_id = p_cafe;
  select name into v_name from public.cafes where id = p_cafe;
  perform public.push_notification(p_user, 'alliance_coupon', 'جایزه همکاری: ' || p.reward_label,
    case when v_status = 'pending_proof'
      then 'برای باز شدن کوپن، کد حضور را از صندوق «' || coalesce(v_name, 'مکان') || '» بگیر و در برگه همان مکان بزن.'
      else 'کوپن «' || coalesce(v_name, 'مکان') || '» تا ' || public.tl_fa_digits(a.coupon_days::text) || ' روز معتبر است. کد را در صندوق نشان بده.' end,
    '🎟️', '/quests?tab=trails');
  if p.budget_total is not null and p.issued + 1 >= p.budget_total then
    perform public.tl_alliance_pause(p_alliance, 'budget', null);
  end if;
  return v_status;
end $$;

-- امتیاز کلن از تمام کردن مسیر؛ فقط برای کسی که خودش رفته
create or replace function public.tl_alliance_clan(p_alliance bigint, p_user uuid)
returns void language plpgsql security definer set search_path to '' as $$
declare v_clan bigint; v_pts integer; v_title text; v_name text; v_old bigint; v_new bigint;
begin
  select clan_bonus, title into v_pts, v_title from public.alliances where id = p_alliance;
  if coalesce(v_pts, 0) <= 0 then return; end if;
  select clan_id into v_clan from public.clan_members where user_id = p_user and is_active;
  if v_clan is null then return; end if;
  select name, points into v_name, v_old from public.clans where id = v_clan and disbanded_at is null;
  if v_name is null then return; end if;
  insert into public.clan_trail_points (alliance_id, user_id, clan_id, points, week_start)
  values (p_alliance, p_user, v_clan, v_pts, public.tl_week_start(now())) on conflict do nothing;
  if not found then return; end if;
  update public.clans set points = points + v_pts where id = v_clan returning points into v_new;
  perform public.tl_clan_event(v_clan, 'trail_done', p_user, null, jsonb_build_object('title', v_title, 'points', v_pts, 'alliance', p_alliance));
  if public.tl_clan_level(v_new) > public.tl_clan_level(v_old) then
    perform public.tl_clan_event(v_clan, 'level', null, null, jsonb_build_object('level', public.tl_clan_level(v_new)));
    perform public.tl_clan_notify(v_clan, 'clan_level', '«' || v_name || '» سطح ' || public.tl_fa_digits(public.tl_clan_level(v_new)::text) || ' شد',
      'سقف اعضا حالا ' || public.tl_fa_digits(public.tl_clan_cap(public.tl_clan_level(v_new))::text) || ' نفر است.', '/clan');
  end if;
end $$;

-- یک قدم مسیر یا حضور در رویداد
create or replace function public.tl_alliance_step(p_alliance bigint, p_user uuid, p_seq smallint, p_at timestamptz)
returns void language plpgsql security definer set search_path to '' as $$
declare a public.alliances; pr public.alliance_progress; v_need integer; v_p record;
begin
  select * into a from public.alliances where id = p_alliance;
  if not found then return; end if;
  v_need := case when a.kind = 'event' then 1
    else coalesce(a.required_steps, (select count(*) from public.alliance_steps s where s.alliance_id = a.id))::integer end;
  select * into pr from public.alliance_progress where alliance_id = a.id and user_id = p_user and status = 'active' for update;
  if pr.id is not null and pr.deadline < p_at then
    update public.alliance_progress set status = 'expired', updated_at = now() where id = pr.id;
    pr := null;
  end if;
  if pr.id is null then
    if exists (select 1 from public.alliance_progress where alliance_id = a.id and user_id = p_user and status = 'done') then return; end if;
    insert into public.alliance_progress (alliance_id, user_id, steps_done, started_at, deadline, updated_at)
    values (a.id, p_user, array[p_seq], p_at, least(p_at + make_interval(hours => a.window_hours), a.ends_at), now())
    returning * into pr;
    if v_need > 1 then
      perform public.push_notification(p_user, 'alliance_step', 'مسیر «' || a.title || '» شروع شد',
        'قدم ' || public.tl_fa_digits('1') || ' از ' || public.tl_fa_digits(v_need::text) || '. بقیه را تا مهلت مسیر برو.', '🧭', '/quests?tab=trails');
    end if;
  else
    if p_seq = any(pr.steps_done) then return; end if;
    update public.alliance_progress set steps_done = steps_done || p_seq, updated_at = now() where id = pr.id returning * into pr;
  end if;
  if a.kind = 'trail' and a.step_xp > 0 then perform public.tl_award_system(p_user, a.step_xp, 'alliance_step'); end if;
  if cardinality(pr.steps_done) >= v_need then
    update public.alliance_progress set status = 'done', completed_at = now(), updated_at = now() where id = pr.id;
    if a.xp_reward > 0 then perform public.tl_award_system(p_user, a.xp_reward, 'alliance_done'); end if;
    for v_p in select cafe_id from public.alliance_parties where alliance_id = a.id and reward_label is not null loop
      perform public.tl_alliance_issue(a.id, v_p.cafe_id, p_user, 'run:' || pr.id);
    end loop;
    if a.kind = 'trail' then perform public.tl_alliance_clan(a.id, p_user); end if;
    insert into public.alliance_events (alliance_id, actor, kind, data) values (a.id, null, 'completed', jsonb_build_object('run', pr.id));
    perform public.push_notification(p_user, 'alliance_done',
      case when a.kind = 'trail' then 'مسیر «' || a.title || '» تمام شد' else 'در «' || a.title || '» بودی' end,
      case when a.xp_reward > 0 then public.tl_fa_digits(a.xp_reward::text) || ' امتیاز گرفتی.' else 'جایزه‌ها در بخش مسیرها است.' end,
      '🏁', '/quests?tab=trails');
  end if;
end $$;

revoke all on function public.tl_op_get(text), public.tl_op_put(text, text, jsonb), public.tl_alliance_log(bigint, bigint, text, jsonb),
  public.tl_alliance_snapshot(bigint), public.tl_alliance_notify(bigint, bigint, text, text, text), public.tl_alliance_problem(bigint),
  public.tl_alliance_pause(bigint, text, bigint), public.tl_alliance_sweep(boolean), public.tl_alliance_issue(bigint, uuid, uuid, text),
  public.tl_alliance_clan(bigint, uuid), public.tl_alliance_step(bigint, uuid, smallint, timestamptz),
  public.tl_cat_root(text), public.tl_cat_complement(text, text)
  from public, anon, authenticated;

-- ═════════ بخش 8: کارت همکاری و تابع‌های کسب‌وکار ═════════

-- کارت یک همکاری برای هر صفحه؛ با کاربر، پیشرفت و کوپن‌های خودش را هم دارد
create or replace function public.tl_alliance_card(p_id bigint, p_user uuid, p_lat double precision default null, p_lng double precision default null)
returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'id', a.id, 'kind', a.kind, 'kind_fa', public.tl_alliance_kind_fa(a.kind), 'title', a.title, 'blurb', a.blurb, 'status', a.status,
    'tier', a.tier, 'window_hours', a.window_hours, 'starts_at', a.starts_at, 'ends_at', a.ends_at, 'is_platform', a.is_platform,
    'step_xp', a.step_xp, 'xp_reward', a.xp_reward, 'clan_bonus', a.clan_bonus, 'coupon_days', a.coupon_days,
    'require_presence', a.require_presence, 'pause_reason', a.pause_reason,
    'need', case when a.kind = 'event' then 1 when a.kind in ('trail') then coalesce(a.required_steps, (select count(*) from public.alliance_steps s where s.alliance_id = a.id)) else null end,
    'places', (select coalesce(jsonb_agg(jsonb_build_object(
                 'seq', x.seq, 'cafe_id', c.id, 'name', c.name, 'branch', c.branch, 'category', c.category, 'district', c.district,
                 'lat', c.lat, 'lng', c.lng, 'reward', p.reward_label, 'is_step', x.is_step, 'business_id', p.business_id,
                 'done', coalesce(x.seq = any(pr.steps_done), false),
                 'distance_m', round(public.tl_dist_m(p_lat, p_lng, c.lat, c.lng)),
                 'walk_min', public.tl_walk_min(public.tl_dist_m(p_lat, p_lng, c.lat, c.lng))) order by x.seq), '[]'::jsonb)
               from (select s.seq::integer seq, s.cafe_id, true is_step from public.alliance_steps s where s.alliance_id = a.id
                     union all
                     select (100 + row_number() over (order by p2.role desc, p2.cafe_id))::integer, p2.cafe_id, false
                       from public.alliance_parties p2
                      where p2.alliance_id = a.id and not exists (select 1 from public.alliance_steps s2 where s2.alliance_id = a.id and s2.cafe_id = p2.cafe_id)) x
               join public.cafes c on c.id = x.cafe_id
               left join public.alliance_parties p on p.alliance_id = a.id and p.cafe_id = x.cafe_id),
    'mine', case when p_user is null then null else (
               select jsonb_build_object('status', q.status, 'steps_done', to_jsonb(q.steps_done), 'deadline', q.deadline,
                        'started_at', q.started_at, 'completed_at', q.completed_at)
                 from public.alliance_progress q where q.alliance_id = a.id and q.user_id = p_user
                order by (q.status = 'active') desc, (q.status = 'done') desc, q.id desc limit 1) end,
    'coupons', case when p_user is null then '[]'::jsonb else (
               select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'code', case when k.status = 'issued' then k.code end, 'cafe_id', k.cafe_id,
                        'place', (select name from public.cafes where id = k.cafe_id), 'reward', k.reward_label, 'status', k.status,
                        'expires_at', k.expires_at, 'redeemed_at', k.redeemed_at) order by k.issued_at desc), '[]'::jsonb)
                 from public.alliance_coupons k where k.alliance_id = a.id and k.user_id = p_user) end)
  from public.alliances a
  left join lateral (select q.steps_done from public.alliance_progress q
                      where q.alliance_id = a.id and q.user_id = p_user and q.status in ('active', 'done')
                      order by (q.status = 'active') desc, q.id desc limit 1) pr on true
  where a.id = p_id
$$;
revoke all on function public.tl_alliance_card(bigint, uuid, double precision, double precision) from public, anon, authenticated;

-- جفت‌های مکان از مشتری مشترک؛ هر 24 ساعت یک بار یا با دستور مالک
create or replace function public.tl_affinity_refresh(p_force boolean default false)
returns integer language plpgsql security definer set search_path to '' as $$
declare v_last timestamptz; v_n integer; v_users numeric;
begin
  select nullif(value, '')::timestamptz into v_last from public.app_settings where key = 'affinity_at';
  if not coalesce(p_force, false) and v_last is not null and v_last > now() - interval '24 hours' then return -1; end if;
  insert into public.app_settings (key, value, updated_at) values ('affinity_at', now()::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  select count(distinct user_id) into v_users from public.checkins where user_id is not null;
  update public.place_affinity set shared = 0, computed_at = now() where shared <> 0;
  with v as (select distinct user_id, cafe_id from public.checkins where user_id is not null and cafe_id is not null),
       u as (select cafe_id, count(*) n from v group by cafe_id),
       pairs as (select a.cafe_id ca, b.cafe_id cb, count(*) shared from v a join v b on a.user_id = b.user_id and a.cafe_id < b.cafe_id
                  group by 1, 2 having count(*) >= 5)
  insert into public.place_affinity (cafe_a, cafe_b, shared, lift, distance_m, tier, computed_at)
  select pairs.ca, pairs.cb, pairs.shared,
         round((pairs.shared * greatest(v_users, 1) / greatest(ua.n * ub.n, 1))::numeric, 2),
         round(public.tl_dist_m(c1.lat, c1.lng, c2.lat, c2.lng))::integer,
         public.tl_dist_tier(public.tl_dist_m(c1.lat, c1.lng, c2.lat, c2.lng)), now()
    from pairs join u ua on ua.cafe_id = pairs.ca join u ub on ub.cafe_id = pairs.cb
    join public.cafes c1 on c1.id = pairs.ca join public.cafes c2 on c2.id = pairs.cb
  on conflict (cafe_a, cafe_b) do update set shared = excluded.shared, lift = excluded.lift, distance_m = excluded.distance_m,
    tier = excluded.tier, computed_at = excluded.computed_at;
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.tl_affinity_refresh(boolean) from public, anon, authenticated;

-- پیشنهاد همکار: مشتری مشترک با کف گروه، مکمل بودن، رده فاصله و جای خالی
create or replace function public.alliance_suggest(p_business bigint)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_me public.businesses; v_c public.cafes; v_min integer;
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  perform public.tl_affinity_refresh(false);
  select * into v_me from public.businesses where id = p_business;
  select * into v_c from public.cafes where id = v_me.cafe_id;
  select coalesce(min_group, 5) into v_min from public.category_profiles where category = coalesce(v_c.category, 'cafe');
  return jsonb_build_object('ok', true, 'items', coalesce((
    select jsonb_agg(z.j order by z.score desc) from (
      select jsonb_build_object('business_id', ob.id, 'cafe_id', oc.id, 'name', oc.name, 'branch', oc.branch, 'category', oc.category,
               'district', oc.district, 'distance_m', round(d.m), 'walk_min', public.tl_walk_min(d.m), 'tier', public.tl_dist_tier(d.m),
               'shared', case when coalesce(pa.shared, 0) >= greatest(coalesce(v_min, 5), coalesce(op.min_group, 5)) then pa.shared end,
               'lift', case when coalesce(pa.shared, 0) >= greatest(coalesce(v_min, 5), coalesce(op.min_group, 5)) then pa.lift end,
               'complement', public.tl_cat_complement(v_c.category, oc.category),
               'competitor', coalesce(oc.category, 'cafe') = coalesce(v_c.category, 'cafe') and d.m <= 600,
               'busy', (select count(*) from public.alliance_parties p join public.alliances a on a.id = p.alliance_id
                         where p.business_id = ob.id and a.status in ('scheduled', 'active', 'paused')) >= 5,
               'kinds', case public.tl_dist_tier(d.m) when 'city' then '["bounceback","trail"]'::jsonb else '["trail","bounceback","event"]'::jsonb end) j,
             0.5 * least(coalesce(case when coalesce(pa.shared, 0) >= 5 then pa.shared end, 0) / 20.0, 1)
               + 0.3 * public.tl_cat_complement(v_c.category, oc.category)
               + 0.2 * case public.tl_dist_tier(d.m) when 'walk' then 1 when 'area' then 0.7 else 0.4 end score
        from public.businesses ob
        join public.cafes oc on oc.id = ob.cafe_id and oc.is_active
        left join public.category_profiles op on op.category = coalesce(oc.category, 'cafe')
        cross join lateral (select coalesce(public.tl_dist_m(v_c.lat, v_c.lng, oc.lat, oc.lng), 99999) m) d
        left join public.place_affinity pa on pa.cafe_a = least(v_c.id, oc.id) and pa.cafe_b = greatest(v_c.id, oc.id)
       where ob.status = 'verified' and ob.id <> p_business and ob.org_id is distinct from v_me.org_id
       order by 2 desc limit 20) z), '[]'::jsonb));
end $$;

-- پیشنهاد همکاری تازه
create or replace function public.alliance_propose(p_business bigint, p_spec jsonb, p_op_key text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := auth.uid(); v_prev jsonb;
  v_kind text := p_spec->>'kind';
  v_title text := btrim(coalesce(p_spec->>'title', ''));
  v_blurb text := nullif(btrim(coalesce(p_spec->>'blurb', '')), '');
  v_reward text := nullif(btrim(coalesce(p_spec->>'reward', '')), '');
  v_btot integer; v_bday integer; v_req integer; v_days integer;
  v_pres boolean := coalesce((p_spec->>'require_presence')::boolean, false);
  v_start timestamptz; v_end timestamptz;
  v_partners bigint[]; v_me public.businesses; v_c public.cafes; v_n integer; v_max double precision := 0;
  v_tier text; v_window integer := 4; v_id bigint; v_status text; v_warn text; v_res jsonb; b record; v_cafes uuid[];
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  v_prev := public.tl_op_get(p_op_key); if v_prev is not null then return v_prev; end if;
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  begin
    v_btot := nullif(p_spec->>'budget_total', '')::integer;
    v_bday := nullif(p_spec->>'budget_daily', '')::integer;
    v_req := nullif(p_spec->>'required_steps', '')::integer;
    v_days := coalesce(nullif(p_spec->>'coupon_days', '')::integer, 14);
    v_start := coalesce(nullif(p_spec->>'starts_at', '')::timestamptz, now());
    v_end := nullif(p_spec->>'ends_at', '')::timestamptz;
    select coalesce(array_agg(distinct x::bigint), '{}') into v_partners from jsonb_array_elements_text(coalesce(p_spec->'partners', '[]'::jsonb)) x;
  exception when others then return jsonb_build_object('ok', false, 'error', 'bad_spec');
  end;
  select * into v_me from public.businesses where id = p_business;
  select * into v_c from public.cafes where id = v_me.cafe_id;
  if not coalesce(v_c.is_active, false) then return jsonb_build_object('ok', false, 'error', 'place_inactive'); end if;
  if v_kind is null or v_kind not in ('trail', 'bounceback', 'event', 'clan_sponsor') then return jsonb_build_object('ok', false, 'error', 'bad_kind'); end if;
  if char_length(v_title) not between 3 and 60 then return jsonb_build_object('ok', false, 'error', 'bad_title'); end if;
  if v_blurb is not null and char_length(v_blurb) > 200 then return jsonb_build_object('ok', false, 'error', 'bad_blurb'); end if;
  if v_reward is not null and char_length(v_reward) not between 2 and 80 then return jsonb_build_object('ok', false, 'error', 'bad_reward'); end if;
  if v_btot is not null and v_btot not between 1 and 10000 then return jsonb_build_object('ok', false, 'error', 'bad_budget'); end if;
  if v_bday is not null and v_bday not between 1 and 1000 then return jsonb_build_object('ok', false, 'error', 'bad_budget'); end if;
  if v_days not between 1 and 60 then return jsonb_build_object('ok', false, 'error', 'bad_coupon_days'); end if;
  v_n := coalesce(array_length(v_partners, 1), 0);
  if p_business = any(v_partners) then return jsonb_build_object('ok', false, 'error', 'self_partner'); end if;
  if (v_kind = 'clan_sponsor' and v_n <> 0) or (v_kind = 'bounceback' and v_n <> 1) or (v_kind = 'event' and v_n > 1)
     or (v_kind = 'trail' and (v_n < 1 or v_n > 4)) then
    return jsonb_build_object('ok', false, 'error', 'bad_partners');
  end if;
  if v_kind = 'clan_sponsor' and v_reward is null then return jsonb_build_object('ok', false, 'error', 'reward_required'); end if;
  if (select count(*) from public.businesses pb join public.cafes pc on pc.id = pb.cafe_id
       where pb.id = any(v_partners) and pb.status = 'verified' and pc.is_active) <> v_n then
    return jsonb_build_object('ok', false, 'error', 'partner_unavailable');
  end if;
  if exists (select 1 from public.businesses pb where pb.id = any(v_partners) and pb.org_id = v_me.org_id) then
    return jsonb_build_object('ok', false, 'error', 'same_brand');
  end if;
  if (select count(*) from public.alliance_parties p join public.alliances a on a.id = p.alliance_id
       where p.business_id = p_business and a.status in ('scheduled', 'active', 'paused')) >= 5 then
    return jsonb_build_object('ok', false, 'error', 'too_many_active');
  end if;
  if (select count(*) from public.alliances where proposer_business = p_business and status in ('proposed', 'countered')) >= 10 then
    return jsonb_build_object('ok', false, 'error', 'too_many_open');
  end if;
  if (select count(*) from public.alliances where proposer_business = p_business and created_at > now() - interval '24 hours') >= 20 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_cafes := array[v_me.cafe_id] || coalesce((select array_agg(pb.cafe_id order by array_position(v_partners, pb.id))
                                                from public.businesses pb where pb.id = any(v_partners)), '{}'::uuid[]);
  select coalesce(max(public.tl_dist_m(c1.lat, c1.lng, c2.lat, c2.lng)), 0) into v_max
    from public.cafes c1, public.cafes c2 where c1.id = any(v_cafes) and c2.id = any(v_cafes) and c1.id < c2.id;
  v_tier := public.tl_dist_tier(v_max);
  if exists (select 1 from public.cafes c2 where c2.id = any(v_cafes) and c2.id <> v_c.id
              and coalesce(c2.category, 'cafe') = coalesce(v_c.category, 'cafe') and public.tl_dist_m(v_c.lat, v_c.lng, c2.lat, c2.lng) <= 600) then
    v_warn := 'competitor';
  end if;

  if v_start < now() - interval '5 minutes' then v_start := now(); end if;
  if v_kind = 'event' and v_end is null then return jsonb_build_object('ok', false, 'error', 'event_needs_end'); end if;
  v_end := coalesce(v_end, v_start + interval '30 days');
  if v_end <= v_start + interval '1 hour' or v_end > v_start + interval '180 days' then return jsonb_build_object('ok', false, 'error', 'bad_dates'); end if;
  if v_kind = 'event' and v_end > v_start + interval '14 days' then return jsonb_build_object('ok', false, 'error', 'bad_dates'); end if;
  if v_kind = 'trail' then
    if (v_tier = 'walk' and array_length(v_cafes, 1) > 4) or (v_tier = 'area' and array_length(v_cafes, 1) > 3) then
      return jsonb_build_object('ok', false, 'error', 'too_many_for_tier', 'tier', v_tier);
    end if;
    if v_req is not null and (v_req < 2 or v_req > array_length(v_cafes, 1)) then return jsonb_build_object('ok', false, 'error', 'bad_required'); end if;
    v_window := public.tl_tier_window(v_tier);
  elsif v_kind = 'event' then
    v_window := least(greatest(1, ceil(extract(epoch from v_end - v_start) / 3600)::integer), 2160);
  else
    v_window := public.tl_tier_window(v_tier);
  end if;
  if v_pres and not exists (select 1 from public.org_devices d join public.businesses bb on bb.id = d.business_id
                              where bb.cafe_id = any(v_cafes) and d.revoked_at is null) then
    return jsonb_build_object('ok', false, 'error', 'no_device');
  end if;

  v_status := case when v_n = 0 then (case when v_start > now() then 'scheduled' else 'active' end) else 'proposed' end;
  insert into public.alliances (kind, title, blurb, status, tier, window_hours, required_steps, starts_at, ends_at, proposer_business, created_by,
                                require_presence, coupon_days, step_xp, xp_reward, clan_bonus)
  values (v_kind, v_title, v_blurb, v_status, v_tier, v_window, case when v_kind = 'trail' then v_req end, v_start, v_end, p_business, v_uid,
          v_pres, v_days, case when v_kind = 'trail' then 10 else 0 end,
          case v_kind when 'trail' then 40 when 'event' then 20 else 0 end, case when v_kind = 'trail' then 40 else 0 end)
  returning id into v_id;
  insert into public.alliance_parties (alliance_id, cafe_id, business_id, role, reward_label, budget_total, budget_daily, accepted_version, accepted_at, accepted_by)
  values (v_id, v_me.cafe_id, p_business, 'proposer', v_reward, v_btot, v_bday, 1, now(), v_uid);
  insert into public.alliance_parties (alliance_id, cafe_id, business_id, role)
  select v_id, pb.cafe_id, pb.id, 'partner' from public.businesses pb where pb.id = any(v_partners);
  if v_kind in ('trail', 'event') then
    insert into public.alliance_steps (alliance_id, seq, cafe_id) select v_id, i, v_cafes[i] from generate_subscripts(v_cafes, 1) i;
  end if;
  perform public.tl_alliance_snapshot(v_id);
  perform public.tl_alliance_log(v_id, p_business, case when v_n = 0 then 'activated' else 'proposed' end, jsonb_build_object('version', 1));
  if v_n > 0 then
    perform public.tl_alliance_notify(v_id, p_business, 'alliance_proposed', 'پیشنهاد همکاری تازه',
      '«' || v_c.name || '» یک ' || public.tl_alliance_kind_fa(v_kind) || ' پیشنهاد داده: ' || v_title);
  end if;
  v_res := jsonb_build_object('ok', true, 'id', v_id, 'status', v_status, 'tier', v_tier, 'warning', v_warn, 'distance_m', round(v_max));
  return public.tl_op_put(p_op_key, 'alliance_propose', v_res);
end $$;

-- عوض کردن شرایط پیش از شروع، یا بالا بردن بودجه خودم بعد از شروع
create or replace function public.alliance_update_terms(p_alliance bigint, p_business bigint, p_spec jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare a public.alliances; me public.alliance_parties; v_ver integer; v_btot integer; v_bday integer; v_req integer; v_days integer;
        v_start timestamptz; v_end timestamptz; v_reward text; v_title text; v_blurb text; v_steps integer;
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select * into a from public.alliances where id = p_alliance for update;
  select * into me from public.alliance_parties where alliance_id = p_alliance and business_id = p_business;
  if a.id is null or me.alliance_id is null then return jsonb_build_object('ok', false, 'error', 'not_party'); end if;
  begin
    v_btot := case when p_spec ? 'budget_total' then nullif(p_spec->>'budget_total', '')::integer else me.budget_total end;
    v_bday := case when p_spec ? 'budget_daily' then nullif(p_spec->>'budget_daily', '')::integer else me.budget_daily end;
    v_req := case when p_spec ? 'required_steps' then nullif(p_spec->>'required_steps', '')::integer else a.required_steps end;
    v_days := coalesce(nullif(p_spec->>'coupon_days', '')::integer, a.coupon_days);
    v_start := coalesce(nullif(p_spec->>'starts_at', '')::timestamptz, a.starts_at);
    v_end := coalesce(nullif(p_spec->>'ends_at', '')::timestamptz, a.ends_at);
  exception when others then return jsonb_build_object('ok', false, 'error', 'bad_spec');
  end;
  if v_btot is not null and v_btot not between 1 and 10000 then return jsonb_build_object('ok', false, 'error', 'bad_budget'); end if;
  if v_bday is not null and v_bday not between 1 and 1000 then return jsonb_build_object('ok', false, 'error', 'bad_budget'); end if;

  if a.status in ('scheduled', 'active', 'paused') then
    if v_btot is not null and v_btot < greatest(coalesce(me.budget_total, 0), me.issued) then
      return jsonb_build_object('ok', false, 'error', 'budget_only_up');
    end if;
    update public.alliance_parties set budget_total = v_btot, budget_daily = v_bday where alliance_id = p_alliance and cafe_id = me.cafe_id;
    perform public.tl_alliance_log(p_alliance, p_business, 'budget_raised', jsonb_build_object('budget_total', v_btot, 'budget_daily', v_bday));
    return jsonb_build_object('ok', true, 'version', a.terms_version, 'status', a.status);
  end if;
  if a.status not in ('proposed', 'countered') then return jsonb_build_object('ok', false, 'error', 'bad_state'); end if;

  v_reward := case when p_spec ? 'reward' then nullif(btrim(coalesce(p_spec->>'reward', '')), '') else me.reward_label end;
  v_title := coalesce(nullif(btrim(coalesce(p_spec->>'title', '')), ''), a.title);
  v_blurb := case when p_spec ? 'blurb' then nullif(btrim(coalesce(p_spec->>'blurb', '')), '') else a.blurb end;
  if v_reward is not null and char_length(v_reward) not between 2 and 80 then return jsonb_build_object('ok', false, 'error', 'bad_reward'); end if;
  if char_length(v_title) not between 3 and 60 then return jsonb_build_object('ok', false, 'error', 'bad_title'); end if;
  if v_blurb is not null and char_length(v_blurb) > 200 then return jsonb_build_object('ok', false, 'error', 'bad_blurb'); end if;
  if v_days not between 1 and 60 then return jsonb_build_object('ok', false, 'error', 'bad_coupon_days'); end if;
  if v_start < now() - interval '5 minutes' then v_start := now(); end if;
  if v_end <= v_start + interval '1 hour' or v_end > v_start + interval '180 days'
     or (a.kind = 'event' and v_end > v_start + interval '14 days') then
    return jsonb_build_object('ok', false, 'error', 'bad_dates');
  end if;
  select count(*) into v_steps from public.alliance_steps where alliance_id = a.id;
  if a.kind = 'trail' and v_req is not null and (v_req < 2 or v_req > v_steps) then return jsonb_build_object('ok', false, 'error', 'bad_required'); end if;

  v_ver := a.terms_version + 1;
  update public.alliances set terms_version = v_ver, status = 'countered', title = v_title, blurb = v_blurb, starts_at = v_start, ends_at = v_end,
         required_steps = case when a.kind = 'trail' then v_req else null end, coupon_days = v_days,
         require_presence = coalesce((p_spec->>'require_presence')::boolean, a.require_presence),
         window_hours = case when a.kind = 'event' then least(greatest(1, ceil(extract(epoch from v_end - v_start) / 3600)::integer), 2160) else a.window_hours end,
         updated_at = now()
   where id = a.id;
  update public.alliance_parties set reward_label = v_reward, budget_total = v_btot, budget_daily = v_bday,
         accepted_version = v_ver, accepted_at = now(), accepted_by = auth.uid()
   where alliance_id = a.id and cafe_id = me.cafe_id;
  update public.alliance_parties set accepted_version = null, accepted_at = null, accepted_by = null
   where alliance_id = a.id and cafe_id <> me.cafe_id;
  perform public.tl_alliance_snapshot(a.id);
  perform public.tl_alliance_log(a.id, p_business, 'countered', jsonb_build_object('version', v_ver));
  perform public.tl_alliance_notify(a.id, p_business, 'alliance_countered', 'شرایط «' || v_title || '» عوض شد',
    'نسخه ' || public.tl_fa_digits(v_ver::text) || ' منتظر پذیرش توست.');
  return jsonb_build_object('ok', true, 'version', v_ver, 'status', 'countered');
end $$;

-- پذیرش دقیقاً همان نسخه‌ای که دیده شده
create or replace function public.alliance_accept(p_alliance bigint, p_business bigint, p_version integer, p_op_key text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare a public.alliances; me public.alliance_parties; v_prev jsonb; v_left integer; v_problem text; v_status text; v_res jsonb;
begin
  v_prev := public.tl_op_get(p_op_key); if v_prev is not null then return v_prev; end if;
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select * into a from public.alliances where id = p_alliance for update;
  select * into me from public.alliance_parties where alliance_id = p_alliance and business_id = p_business for update;
  if a.id is null or me.alliance_id is null then return jsonb_build_object('ok', false, 'error', 'not_party'); end if;
  if a.status in ('scheduled', 'active') and me.accepted_version = a.terms_version then
    return jsonb_build_object('ok', true, 'status', a.status, 'already', true);
  end if;
  if a.status not in ('proposed', 'countered') then return jsonb_build_object('ok', false, 'error', 'bad_state', 'status', a.status); end if;
  if p_version is distinct from a.terms_version then
    return jsonb_build_object('ok', false, 'error', 'version_mismatch', 'version', a.terms_version);
  end if;
  if me.accepted_version = a.terms_version then return jsonb_build_object('ok', true, 'status', a.status, 'already', true); end if;
  if (select count(*) from public.alliance_parties p join public.alliances x on x.id = p.alliance_id
       where p.business_id = p_business and x.status in ('scheduled', 'active', 'paused')) >= 5 then
    return jsonb_build_object('ok', false, 'error', 'too_many_active');
  end if;
  select count(*) into v_left from public.alliance_parties
   where alliance_id = a.id and business_id is not null and cafe_id <> me.cafe_id and accepted_version is distinct from a.terms_version;
  if v_left = 0 then
    if a.kind in ('bounceback', 'clan_sponsor') and not exists (select 1 from public.alliance_parties where alliance_id = a.id and reward_label is not null) then
      return jsonb_build_object('ok', false, 'error', 'reward_required');
    end if;
    v_problem := public.tl_alliance_problem(a.id);
    if v_problem is not null then return jsonb_build_object('ok', false, 'error', 'cannot_start', 'reason', v_problem); end if;
  end if;
  update public.alliance_parties set accepted_version = a.terms_version, accepted_at = now(), accepted_by = auth.uid()
   where alliance_id = a.id and cafe_id = me.cafe_id;
  perform public.tl_alliance_log(a.id, p_business, 'accepted', jsonb_build_object('version', a.terms_version));
  v_status := a.status;
  if v_left = 0 then
    v_status := case when a.starts_at > now() then 'scheduled' else 'active' end;
    update public.alliances set status = v_status, updated_at = now() where id = a.id;
    perform public.tl_alliance_log(a.id, p_business, 'activated', jsonb_build_object('version', a.terms_version));
    perform public.tl_alliance_notify(a.id, null, 'alliance_active',
      case when v_status = 'active' then 'همکاری «' || a.title || '» شروع شد' else 'همکاری «' || a.title || '» زمان‌بندی شد' end,
      'همه طرف‌ها نسخه ' || public.tl_fa_digits(a.terms_version::text) || ' را پذیرفتند.');
  else
    perform public.tl_alliance_notify(a.id, p_business, 'alliance_accepted', 'یک طرف «' || a.title || '» را پذیرفت',
      'منتظر پذیرش بقیه طرف‌ها.');
  end if;
  v_res := jsonb_build_object('ok', true, 'status', v_status, 'version', a.terms_version);
  return public.tl_op_put(p_op_key, 'alliance_accept', v_res);
end $$;

-- رد، پس گرفتن، نگه داشتن، ادامه و پایان
create or replace function public.alliance_action(p_alliance bigint, p_business bigint, p_action text, p_note text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare a public.alliances; me public.alliance_parties; v_problem text; v_gap interval; v_new text;
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select * into a from public.alliances where id = p_alliance for update;
  select * into me from public.alliance_parties where alliance_id = p_alliance and business_id = p_business;
  if a.id is null or me.alliance_id is null then return jsonb_build_object('ok', false, 'error', 'not_party'); end if;
  if p_action = 'decline' then
    if a.status not in ('proposed', 'countered') or me.accepted_version = a.terms_version then
      return jsonb_build_object('ok', false, 'error', 'bad_state');
    end if;
    v_new := 'declined';
  elsif p_action = 'withdraw' then
    if a.status not in ('proposed', 'countered') or me.accepted_version is distinct from a.terms_version then
      return jsonb_build_object('ok', false, 'error', 'bad_state');
    end if;
    v_new := 'withdrawn';
  elsif p_action = 'pause' then
    if a.status not in ('active', 'scheduled') then return jsonb_build_object('ok', false, 'error', 'bad_state'); end if;
    perform public.tl_alliance_pause(a.id, 'manual:' || coalesce(left(p_note, 80), ''), p_business);
    return jsonb_build_object('ok', true, 'status', 'paused');
  elsif p_action = 'resume' then
    if a.status <> 'paused' then return jsonb_build_object('ok', false, 'error', 'bad_state'); end if;
    v_problem := public.tl_alliance_problem(a.id);
    if v_problem is not null then return jsonb_build_object('ok', false, 'error', 'cannot_resume', 'reason', v_problem); end if;
    v_gap := now() - coalesce(a.paused_at, now());
    update public.alliance_progress set deadline = deadline + v_gap, updated_at = now() where alliance_id = a.id and status = 'active';
    v_new := case when a.starts_at > now() then 'scheduled' else 'active' end;
    update public.alliances set status = v_new, paused_at = null, pause_reason = null, ends_at = greatest(ends_at, now() + interval '1 day'), updated_at = now()
     where id = a.id;
    perform public.tl_alliance_log(a.id, p_business, 'resumed', jsonb_build_object('gap_hours', round(extract(epoch from v_gap) / 3600)));
    perform public.tl_alliance_notify(a.id, p_business, 'alliance_resumed', 'همکاری «' || a.title || '» ادامه پیدا کرد',
      'مهلت کاربرانی که وسط راه بودند به اندازه توقف بلندتر شد.');
    return jsonb_build_object('ok', true, 'status', v_new);
  elsif p_action = 'end' then
    if a.status not in ('scheduled', 'active', 'paused') then return jsonb_build_object('ok', false, 'error', 'bad_state'); end if;
    v_new := 'ended';
  else
    return jsonb_build_object('ok', false, 'error', 'bad_action');
  end if;
  update public.alliances set status = v_new, updated_at = now() where id = a.id;
  perform public.tl_alliance_log(a.id, p_business, v_new, jsonb_build_object('note', left(p_note, 120)));
  perform public.tl_alliance_notify(a.id, p_business, 'alliance_' || v_new,
    case v_new when 'declined' then 'پیشنهاد «' || a.title || '» رد شد' when 'withdrawn' then 'پیشنهاد «' || a.title || '» پس گرفته شد'
      else 'همکاری «' || a.title || '» تمام شد' end,
    coalesce(nullif(left(p_note, 120), ''), case v_new when 'ended' then 'کوپن‌های داده‌شده تا تاریخ خودشان معتبرند.' else 'می‌توانی پیشنهاد تازه بدهی.' end));
  return jsonb_build_object('ok', true, 'status', v_new);
end $$;

-- همه همکاری‌های یک شعبه برای پنل، با نتیجه‌ها و خط زمانی؛ عدد مشترک زیر 5 نشان داده نمی‌شود
create or replace function public.alliance_list_business(p_business bigint)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_me public.businesses; v_c public.cafes;
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  perform public.tl_alliance_sweep(false);
  select * into v_me from public.businesses where id = p_business;
  select * into v_c from public.cafes where id = v_me.cafe_id;
  return jsonb_build_object('ok', true,
    'active_count', (select count(*) from public.alliance_parties p join public.alliances a on a.id = p.alliance_id
                      where p.business_id = p_business and a.status in ('scheduled', 'active', 'paused')),
    'has_device', exists (select 1 from public.org_devices d where d.business_id = p_business and d.revoked_at is null),
    'items', coalesce((
      select jsonb_agg(public.tl_alliance_card(a.id, null, v_c.lat, v_c.lng) || jsonb_build_object(
               'terms_version', a.terms_version, 'proposer_business', a.proposer_business, 'created_at', a.created_at, 'updated_at', a.updated_at,
               'my_role', me.role, 'my_cafe', me.cafe_id, 'my_accepted', me.accepted_version = a.terms_version,
               'parties', (select jsonb_agg(jsonb_build_object('business_id', p.business_id, 'cafe_id', p.cafe_id, 'name', c.name, 'branch', c.branch,
                             'category', c.category, 'district', c.district, 'role', p.role, 'reward', p.reward_label, 'budget_total', p.budget_total,
                             'budget_daily', p.budget_daily, 'issued', p.issued, 'redeemed', p.redeemed, 'is_me', p.business_id = p_business,
                             'accepted', p.accepted_version = a.terms_version,
                             'distance_m', round(public.tl_dist_m(v_c.lat, v_c.lng, c.lat, c.lng))) order by (p.business_id = p_business) desc, p.role desc)
                             from public.alliance_parties p join public.cafes c on c.id = p.cafe_id where p.alliance_id = a.id),
               'results', (select jsonb_build_object(
                             'completions', case when x.done >= 5 then x.done end, 'completions_small', x.done between 1 and 4,
                             'runs_active', case when x.act >= 5 then x.act end, 'runs_small', x.act between 1 and 4,
                             'my_issued', me.issued, 'my_redeemed', me.redeemed)
                             from (select count(*) filter (where q.status = 'done') done, count(*) filter (where q.status = 'active') act
                                     from public.alliance_progress q where q.alliance_id = a.id) x),
               'events', (select coalesce(jsonb_agg(jsonb_build_object('kind', e.kind, 'at', e.created_at, 'data', e.data,
                             'by', (select c.name from public.businesses b join public.cafes c on c.id = b.cafe_id where b.id = e.business_id)) order by e.created_at desc), '[]'::jsonb)
                            from (select * from public.alliance_events e0 where e0.alliance_id = a.id
                                    and e0.kind in ('proposed', 'countered', 'accepted', 'activated', 'started', 'paused', 'resumed', 'ended', 'declined', 'withdrawn', 'expired', 'budget_raised')
                                  order by e0.created_at desc limit 12) e))
             order by case when a.status in ('proposed', 'countered') and me.accepted_version is distinct from a.terms_version then 0
                           when a.status in ('active', 'paused', 'scheduled') then 1 when a.status in ('proposed', 'countered') then 2 else 3 end,
                      a.updated_at desc)
        from public.alliance_parties me join public.alliances a on a.id = me.alliance_id
       where me.business_id = p_business and a.updated_at > now() - interval '120 days'), '[]'::jsonb));
end $$;

revoke all on function public.alliance_suggest(bigint), public.alliance_propose(bigint, jsonb, text), public.alliance_update_terms(bigint, bigint, jsonb),
  public.alliance_accept(bigint, bigint, integer, text), public.alliance_action(bigint, bigint, text, text), public.alliance_list_business(bigint)
  from public, anon;

-- ═════════ بخش 9: سمت کاربر، موتور پیشرفت، کد حضور، تأیید کوپن ═════════

-- همکاری‌های فعال نزدیک یک نقطه، یا همه اگر نقطه نیامده
create or replace function public.alliances_near(p_lat double precision default null, p_lng double precision default null, p_km double precision default 5)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_km double precision := least(greatest(coalesce(p_km, 5), 0.5), 30); v_uid uuid := auth.uid();
begin
  perform public.tl_alliance_sweep(false);
  return coalesce((
    select jsonb_agg(public.tl_alliance_card(z.id, v_uid, p_lat, p_lng) || jsonb_build_object('nearest_m', round(z.d)) order by z.mine desc, z.d nulls last)
      from (select a.id, min(public.tl_dist_m(p_lat, p_lng, c.lat, c.lng)) d,
                   bool_or(v_uid is not null and exists (select 1 from public.alliance_progress q where q.alliance_id = a.id and q.user_id = v_uid and q.status = 'active')) mine
              from public.alliances a
              join lateral (select s.cafe_id from public.alliance_steps s where s.alliance_id = a.id
                            union select p.cafe_id from public.alliance_parties p where p.alliance_id = a.id) pl on true
              join public.cafes c on c.id = pl.cafe_id and c.is_active
             where a.status = 'active' and a.ends_at > now()
             group by a.id
            having p_lat is null or p_lng is null or min(public.tl_dist_m(p_lat, p_lng, c.lat, c.lng)) <= v_km * 1000
             order by 3 desc, 2 nulls last limit 40) z), '[]'::jsonb);
end $$;

-- همکاری‌های یک مکان، برای برگه مکان؛ فاصله از همین مکان
create or replace function public.alliances_at_place(p_cafe uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_c public.cafes;
begin
  select * into v_c from public.cafes where id = p_cafe;
  if not found then return '[]'::jsonb; end if;
  perform public.tl_alliance_sweep(false);
  return coalesce((
    select jsonb_agg(public.tl_alliance_card(a.id, auth.uid(), v_c.lat, v_c.lng) order by a.kind, a.id)
      from public.alliances a
     where a.status = 'active' and a.ends_at > now()
       and (exists (select 1 from public.alliance_steps s where s.alliance_id = a.id and s.cafe_id = p_cafe)
         or exists (select 1 from public.alliance_parties p where p.alliance_id = a.id and p.cafe_id = p_cafe))), '[]'::jsonb);
end $$;

create or replace function public.alliance_detail(p_id bigint)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v jsonb;
begin
  select public.tl_alliance_card(a.id, auth.uid()) into v from public.alliances a
   where a.id = p_id and (a.status in ('active', 'paused', 'ended', 'scheduled')
     or exists (select 1 from public.alliance_parties p where p.alliance_id = a.id and p.business_id is not null and public.owns_business(p.business_id)));
  if v is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'item', v);
end $$;

-- مسیرهای من: در حال رفتن، تمام‌شده در 30 روز، و کوپن‌های باز
create or replace function public.my_alliances()
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  perform public.tl_alliance_sweep(false);
  return jsonb_build_object('ok', true,
    'items', coalesce((select jsonb_agg(public.tl_alliance_card(x.id, v_uid) order by x.rank, x.at desc)
                         from (select a.id, min(case when q.status = 'active' then 0 when k.status in ('issued', 'pending_proof') then 1 else 2 end) rank,
                                      max(greatest(q.updated_at, k.issued_at)) at
                                 from public.alliances a
                                 left join public.alliance_progress q on q.alliance_id = a.id and q.user_id = v_uid
                                 left join public.alliance_coupons k on k.alliance_id = a.id and k.user_id = v_uid
                                where (q.id is not null and (q.status = 'active' or q.updated_at > now() - interval '30 days'))
                                   or (k.id is not null and (k.status in ('issued', 'pending_proof') or k.issued_at > now() - interval '30 days'))
                                group by a.id
                                limit 40) x), '[]'::jsonb),
    'open_coupons', (select count(*) from public.alliance_coupons k where k.user_id = v_uid and k.status in ('issued', 'pending_proof')));
end $$;

-- موتور پیشرفت: کنار تریگر کلن روی هر چک‌این. چک‌این کارکنان در محل کار خودشان و حساب کسب‌وکار حساب نمی‌شود
create or replace function public.tl_alliance_on_checkin()
returns trigger language plpgsql security definer set search_path to '' as $$
declare r record; p record; m record; x record; v_clan bigint; v_n integer; v_att integer;
begin
  if new.user_id is null or new.cafe_id is null then return new; end if;
  if exists (select 1 from public.profiles where id = new.user_id and account_type = 'sme') then return new; end if;
  if public.tl_works_at(new.user_id, new.cafe_id) then return new; end if;
  perform public.tl_alliance_sweep(false);

  for r in select a.id, s.seq from public.alliances a join public.alliance_steps s on s.alliance_id = a.id and s.cafe_id = new.cafe_id
            where a.status = 'active' and a.kind in ('trail', 'event') and new.created_at >= a.starts_at and new.created_at < a.ends_at loop
    perform public.tl_alliance_step(r.id, new.user_id, r.seq, new.created_at);
  end loop;

  for r in select a.id from public.alliances a join public.alliance_parties pp on pp.alliance_id = a.id and pp.cafe_id = new.cafe_id
            where a.status = 'active' and a.kind = 'bounceback' and new.created_at >= a.starts_at and new.created_at < a.ends_at loop
    for p in select q.cafe_id from public.alliance_parties q where q.alliance_id = r.id and q.cafe_id <> new.cafe_id and q.reward_label is not null loop
      if not exists (select 1 from public.checkins ci where ci.user_id = new.user_id and ci.cafe_id = p.cafe_id) then
        perform public.tl_alliance_issue(r.id, p.cafe_id, new.user_id, 'once');
      end if;
    end loop;
  end loop;

  select clan_id into v_clan from public.clan_members where user_id = new.user_id and is_active;
  if v_clan is not null then
    select count(*) into v_n from public.clan_members where clan_id = v_clan and is_active;
    for r in select a.id from public.alliances a join public.alliance_parties pp on pp.alliance_id = a.id and pp.cafe_id = new.cafe_id
              where a.status = 'active' and a.kind = 'clan_sponsor' and new.created_at >= a.starts_at and new.created_at < a.ends_at loop
      for m in select * from public.clan_meetups
                where clan_id = v_clan and cafe_id = new.cafe_id and status in ('open', 'done')
                  and new.created_at between starts_at - interval '30 minutes' and starts_at + interval '3 hours' loop
        select count(distinct ci.user_id) into v_att from public.checkins ci
          join public.clan_members cm on cm.user_id = ci.user_id and cm.clan_id = v_clan and cm.is_active
         where ci.cafe_id = m.cafe_id and ci.created_at between m.starts_at - interval '30 minutes' and m.starts_at + interval '3 hours';
        if v_att >= (case when v_n < 4 then 2 else 3 end) then
          for x in select distinct ci.user_id from public.checkins ci
                     join public.clan_members cm on cm.user_id = ci.user_id and cm.clan_id = v_clan and cm.is_active
                    where ci.cafe_id = m.cafe_id and ci.created_at between m.starts_at - interval '30 minutes' and m.starts_at + interval '3 hours' loop
            perform public.tl_alliance_issue(r.id, new.cafe_id, x.user_id, 'meetup:' || m.id);
          end loop;
        end if;
      end loop;
    end loop;
  end if;
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.tl_alliance_on_checkin() from public, anon, authenticated;
create or replace trigger checkins_alliance after insert on public.checkins
  for each row execute function public.tl_alliance_on_checkin();

-- کد شش‌رقمی چرخان، هر 30 ثانیه
create or replace function public.tl_totp(p_secret bytea, p_step bigint)
returns text language sql immutable set search_path to '' as $$
  select lpad(((('x' || substr(encode(extensions.hmac(int8send(p_step), p_secret, 'sha256'), 'hex'), 1, 8))::bit(32)::bigint % 1000000))::text, 6, '0')
$$;
revoke all on function public.tl_totp(bytea, bigint) from public, anon, authenticated;

create or replace function public.org_device_add(p_business bigint, p_label text default 'صندوق')
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_id bigint; v_label text := left(btrim(coalesce(nullif(p_label, ''), 'صندوق')), 40);
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  if (select count(*) from public.org_devices where business_id = p_business and revoked_at is null) >= 3 then
    return jsonb_build_object('ok', false, 'error', 'too_many');
  end if;
  insert into public.org_devices (business_id, label, created_by) values (p_business, v_label, auth.uid()) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'label', v_label);
end $$;

create or replace function public.org_device_list(p_business bigint)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not coalesce(public.tl_staff_of(p_business), false) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  return jsonb_build_object('ok', true, 'items', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'label', d.label, 'created_at', d.created_at) order by d.id)
    from public.org_devices d where d.business_id = p_business and d.revoked_at is null), '[]'::jsonb));
end $$;

create or replace function public.org_device_revoke(p_business bigint, p_device bigint)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if not public.owns_business(p_business) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  update public.org_devices set revoked_at = now() where id = p_device and business_id = p_business and revoked_at is null;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- کد حضور برای صفحه دستگاه مغازه؛ راز هرگز بیرون نمی‌رود
create or replace function public.presence_code(p_device bigint)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare d public.org_devices; v_step bigint; v_epoch bigint := floor(extract(epoch from clock_timestamp()))::bigint; v_name text;
begin
  select * into d from public.org_devices where id = p_device and revoked_at is null;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if not coalesce(public.tl_staff_of(d.business_id), false) then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  v_step := v_epoch / 30;
  select c.name into v_name from public.businesses b join public.cafes c on c.id = b.cafe_id where b.id = d.business_id;
  return jsonb_build_object('ok', true, 'code', public.tl_totp(d.secret, v_step), 'seconds_left', 30 - (v_epoch % 30),
    'label', d.label, 'place', v_name);
end $$;

-- کاربر کد صندوق را می‌زند؛ اگر درست بود اثبات سطح دو ثبت می‌شود و کوپن‌های منتظر باز می‌شوند
create or replace function public.verify_presence(p_cafe uuid, p_code text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); v_code text; v_chk uuid; v_dev bigint; v_step bigint; v_n integer := 0; k record;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  v_code := regexp_replace(translate(coalesce(p_code, ''), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'), '[^0-9]', '', 'g');
  if char_length(v_code) <> 6 then return jsonb_build_object('ok', false, 'error', 'bad_code'); end if;
  if (select count(*) from public.presence_attempts where user_id = v_uid and not ok and created_at > now() - interval '10 minutes') >= 6 then
    return jsonb_build_object('ok', false, 'error', 'too_many_tries');
  end if;
  select id into v_chk from public.checkins where user_id = v_uid and cafe_id = p_cafe and created_at > now() - interval '4 hours'
   order by created_at desc limit 1;
  if v_chk is null then return jsonb_build_object('ok', false, 'error', 'no_checkin'); end if;
  v_step := floor(extract(epoch from clock_timestamp()))::bigint / 30;
  select d.id into v_dev from public.org_devices d join public.businesses b on b.id = d.business_id
   where b.cafe_id = p_cafe and b.status = 'verified' and d.revoked_at is null
     and v_code in (public.tl_totp(d.secret, v_step), public.tl_totp(d.secret, v_step - 1), public.tl_totp(d.secret, v_step - 2))
   limit 1;
  insert into public.presence_attempts (user_id, cafe_id, ok) values (v_uid, p_cafe, v_dev is not null);
  if v_dev is null then return jsonb_build_object('ok', false, 'error', 'wrong_code'); end if;
  insert into public.presence_proofs (checkin_id, user_id, cafe_id, level, method, device_id)
  values (v_chk, v_uid, p_cafe, 2, 'code', v_dev) on conflict (checkin_id, method) do nothing;
  for k in update public.alliance_coupons set status = 'issued'
            where user_id = v_uid and status = 'pending_proof' and expires_at > now()
              and alliance_id in (select s.alliance_id from public.alliance_steps s where s.cafe_id = p_cafe
                                  union select p.alliance_id from public.alliance_parties p where p.cafe_id = p_cafe)
            returning id loop
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'level', 2, 'released', v_n);
end $$;

-- تأیید کد در صندوق برای صاحب، مدیر و کارمند: کوپن همکاری یا کد جایزه رویداد
create or replace function public.staff_redeem(p_code text, p_op_key text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); v_prev jsonb; v_code text := upper(btrim(coalesce(p_code, ''))); k public.alliance_coupons;
        r public.redemptions; v_biz bigint; v_cafe uuid; v_name text; v_res jsonb; v_today integer;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  v_prev := public.tl_op_get(p_op_key); if v_prev is not null then return v_prev; end if;
  if char_length(v_code) < 4 then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  select * into k from public.alliance_coupons where code = v_code for update;
  if k.id is not null then
    select b.id, b.cafe_id into v_biz, v_cafe from public.businesses b where b.cafe_id = k.cafe_id and b.status = 'verified' and coalesce(public.tl_staff_of(b.id), false) limit 1;
    if v_biz is null then return jsonb_build_object('ok', false, 'error', 'not_authorized'); end if;
    if k.user_id = v_uid then return jsonb_build_object('ok', false, 'error', 'own_coupon'); end if;
    if k.status = 'redeemed' then return jsonb_build_object('ok', false, 'error', 'already_used', 'redeemed_at', k.redeemed_at); end if;
    if k.status = 'pending_proof' then return jsonb_build_object('ok', false, 'error', 'needs_presence'); end if;
    if k.status <> 'issued' or k.expires_at < now() then
      update public.alliance_coupons set status = 'expired' where id = k.id and status = 'issued';
      return jsonb_build_object('ok', false, 'error', 'expired');
    end if;
    select count(*) into v_today from public.alliance_coupons where business_id = v_biz and status = 'redeemed'
       and (redeemed_at at time zone 'Asia/Tehran')::date = (now() at time zone 'Asia/Tehran')::date;
    if v_today >= 300 then return jsonb_build_object('ok', false, 'error', 'daily_cap'); end if;
    update public.alliance_coupons set status = 'redeemed', redeemed_at = now(), redeemed_by = v_uid where id = k.id;
    update public.alliance_parties set redeemed = redeemed + 1 where alliance_id = k.alliance_id and cafe_id = k.cafe_id;
    perform public.tl_alliance_log(k.alliance_id, v_biz, 'redeemed', jsonb_build_object('coupon', k.id));
    select name into v_name from public.cafes where id = k.cafe_id;
    perform public.push_notification(k.user_id, 'redeemed', 'کوپن استفاده شد', coalesce(v_name, 'مکان') || ' جایزه‌ات را داد: ' || k.reward_label, '🎟️', '/quests?tab=trails');
    v_res := jsonb_build_object('ok', true, 'kind', 'alliance', 'reward', k.reward_label);
    return public.tl_op_put(p_op_key, 'staff_redeem', v_res);
  end if;

  select * into r from public.redemptions where code = v_code for update;
  if r.id is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  select q.business_id into v_biz from public.quests q where q.id = r.quest_id;
  if v_biz is null or not coalesce(public.tl_staff_of(v_biz), false) then return jsonb_build_object('ok', false, 'error', 'not_authorized'); end if;
  if r.user_id = v_uid then return jsonb_build_object('ok', false, 'error', 'own_coupon'); end if;
  if r.status = 'redeemed' then return jsonb_build_object('ok', false, 'error', 'already_used', 'redeemed_at', r.redeemed_at); end if;
  if r.expires_at is not null and r.expires_at < now() then
    update public.redemptions set status = 'expired' where id = r.id;
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;
  update public.redemptions set status = 'redeemed', redeemed_at = now() where id = r.id;
  select c.name into v_name from public.businesses b join public.cafes c on c.id = b.cafe_id where b.id = v_biz;
  perform public.push_notification(r.user_id, 'redeemed', '✅ کدت استفاده شد', coalesce(v_name, 'یه کافه') || ' جایزه‌ت رو تحویل داد: ' || r.reward_label, '🎟️', '/quests');
  v_res := jsonb_build_object('ok', true, 'kind', 'quest', 'reward', r.reward_label);
  return public.tl_op_put(p_op_key, 'staff_redeem', v_res);
end $$;

-- ═════════ بخش 10: مسیرهای شهری TwinLand، ادمین، درست کردن B-10 ═════════

-- مسیر یا رویداد شهری که خود TwinLand می‌سازد؛ فقط امتیاز و بدون کسب‌وکار، برای شروع سرد
create or replace function public.alliance_platform_create(p_spec jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_kind text := coalesce(p_spec->>'kind', 'trail'); v_title text := btrim(coalesce(p_spec->>'title', ''));
        v_blurb text := nullif(btrim(coalesce(p_spec->>'blurb', '')), ''); v_steps uuid[]; v_req integer; v_start timestamptz; v_end timestamptz;
        v_max double precision; v_tier text; v_window integer; v_id bigint; v_xp integer; v_sxp integer; v_clan integer;
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  begin
    select array_agg(x::uuid order by o) into v_steps from jsonb_array_elements_text(coalesce(p_spec->'steps', '[]'::jsonb)) with ordinality t(x, o);
    v_req := nullif(p_spec->>'required_steps', '')::integer;
    v_start := coalesce(nullif(p_spec->>'starts_at', '')::timestamptz, now());
    v_end := coalesce(nullif(p_spec->>'ends_at', '')::timestamptz, v_start + interval '30 days');
    v_xp := coalesce(nullif(p_spec->>'xp_reward', '')::integer, 60);
    v_sxp := coalesce(nullif(p_spec->>'step_xp', '')::integer, 10);
    v_clan := coalesce(nullif(p_spec->>'clan_bonus', '')::integer, 40);
  exception when others then return jsonb_build_object('ok', false, 'error', 'bad_spec');
  end;
  if v_kind not in ('trail', 'event') then return jsonb_build_object('ok', false, 'error', 'bad_kind'); end if;
  if char_length(v_title) not between 3 and 60 then return jsonb_build_object('ok', false, 'error', 'bad_title'); end if;
  if v_steps is null or array_length(v_steps, 1) < (case when v_kind = 'trail' then 2 else 1 end) or array_length(v_steps, 1) > 5
     or (select count(distinct u) from unnest(v_steps) u) <> array_length(v_steps, 1) then
    return jsonb_build_object('ok', false, 'error', 'bad_steps');
  end if;
  if (select count(*) from public.cafes c join public.place_categories pc on pc.key = coalesce(c.category, 'cafe')
       where c.id = any(v_steps) and c.is_active and pc.in_game) <> array_length(v_steps, 1) then
    return jsonb_build_object('ok', false, 'error', 'place_unavailable');
  end if;
  if v_end <= v_start + interval '1 hour' or v_end > v_start + interval '180 days' then return jsonb_build_object('ok', false, 'error', 'bad_dates'); end if;
  if v_xp not between 0 and 200 or v_sxp not between 0 and 30 or v_clan not between 0 and 100 then return jsonb_build_object('ok', false, 'error', 'bad_xp'); end if;
  select coalesce(max(public.tl_dist_m(c1.lat, c1.lng, c2.lat, c2.lng)), 0) into v_max
    from public.cafes c1, public.cafes c2 where c1.id = any(v_steps) and c2.id = any(v_steps) and c1.id < c2.id;
  v_tier := public.tl_dist_tier(v_max);
  if v_kind = 'trail' and v_req is not null and (v_req < 2 or v_req > array_length(v_steps, 1)) then return jsonb_build_object('ok', false, 'error', 'bad_required'); end if;
  v_window := case when v_kind = 'event' then least(greatest(1, ceil(extract(epoch from v_end - v_start) / 3600)::integer), 2160)
                   else coalesce(nullif(p_spec->>'window_hours', '')::integer, public.tl_tier_window(v_tier)) end;
  if v_window not between 1 and 2160 then return jsonb_build_object('ok', false, 'error', 'bad_window'); end if;
  insert into public.alliances (kind, title, blurb, status, tier, window_hours, required_steps, starts_at, ends_at, is_platform, created_by,
                                step_xp, xp_reward, clan_bonus, coupon_days)
  values (v_kind, v_title, v_blurb, case when v_start > now() then 'scheduled' else 'active' end, v_tier, v_window,
          case when v_kind = 'trail' then v_req end, v_start, v_end, true, auth.uid(), case when v_kind = 'trail' then v_sxp else 0 end,
          v_xp, case when v_kind = 'trail' then v_clan else 0 end, 14)
  returning id into v_id;
  insert into public.alliance_steps (alliance_id, seq, cafe_id) select v_id, i, v_steps[i] from generate_subscripts(v_steps, 1) i;
  perform public.tl_alliance_snapshot(v_id);
  perform public.tl_alliance_log(v_id, null, 'activated', jsonb_build_object('platform', true));
  return jsonb_build_object('ok', true, 'id', v_id, 'tier', v_tier, 'distance_m', round(v_max), 'window_hours', v_window);
end $$;

create or replace function public.alliance_platform_action(p_id bigint, p_action text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare a public.alliances; v_gap interval;
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select * into a from public.alliances where id = p_id for update;
  if a.id is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if p_action = 'pause' and a.status in ('active', 'scheduled') then
    update public.alliances set status = 'paused', paused_at = now(), pause_reason = 'manual:owner', updated_at = now() where id = p_id;
  elsif p_action = 'resume' and a.status = 'paused' then
    v_gap := now() - coalesce(a.paused_at, now());
    update public.alliance_progress set deadline = deadline + v_gap, updated_at = now() where alliance_id = p_id and status = 'active';
    update public.alliances set status = case when starts_at > now() then 'scheduled' else 'active' end, paused_at = null, pause_reason = null,
           ends_at = greatest(ends_at, now() + interval '1 day'), updated_at = now() where id = p_id;
  elsif p_action = 'end' and a.status in ('scheduled', 'active', 'paused', 'proposed', 'countered') then
    update public.alliances set status = 'ended', updated_at = now() where id = p_id;
  else
    return jsonb_build_object('ok', false, 'error', 'bad_state');
  end if;
  perform public.tl_alliance_log(p_id, null, p_action || '_owner', '{}'::jsonb);
  return jsonb_build_object('ok', true, 'status', (select status from public.alliances where id = p_id));
end $$;

create or replace function public.alliance_admin_overview()
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  perform public.tl_alliance_sweep(true);
  return jsonb_build_object('ok', true,
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.alliances group by status) s),
    'coupons', (select jsonb_build_object('issued', count(*), 'redeemed', count(*) filter (where status = 'redeemed'),
                  'pending', count(*) filter (where status = 'pending_proof')) from public.alliance_coupons),
    'runs', (select jsonb_build_object('active', count(*) filter (where status = 'active'), 'done', count(*) filter (where status = 'done'))
               from public.alliance_progress),
    'devices', (select count(*) from public.org_devices where revoked_at is null),
    'items', coalesce((select jsonb_agg(public.tl_alliance_card(a.id, null) || jsonb_build_object('created_at', a.created_at,
               'parties_n', (select count(*) from public.alliance_parties p where p.alliance_id = a.id),
               'done_n', (select count(*) from public.alliance_progress q where q.alliance_id = a.id and q.status = 'done')) order by a.created_at desc)
               from (select * from public.alliances order by created_at desc limit 30) a), '[]'::jsonb));
end $$;

create or replace function public.alliance_affinity_rebuild()
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  return jsonb_build_object('ok', true, 'pairs', public.tl_affinity_refresh(true));
end $$;

-- B-10: عدد مشتری مشترک در فهرست همکار فقط از 5 نفر به بالا
create or replace function public.business_collab_overview(p_business_id bigint)
returns json language plpgsql stable security definer set search_path to '' as $$
declare v_cafe uuid;
begin
  if not public.owns_business(p_business_id) then
    return json_build_object('ok', false, 'error', 'not_allowed');
  end if;
  select b.cafe_id into v_cafe from public.businesses b where b.id = p_business_id;

  return json_build_object(
    'ok', true,
    'items', coalesce((
      select json_agg(json_build_object(
               'id', k.id, 'kind', k.kind, 'title', k.title, 'message', k.message, 'status', k.status,
               'created_at', k.created_at, 'responded_at', k.responded_at,
               'incoming', k.to_business = p_business_id,
               'other_business', case when k.to_business = p_business_id then k.from_business else k.to_business end,
               'other_name', oc.name, 'other_district', oc.district)
             order by k.created_at desc)
        from public.business_collabs k
        join public.businesses ob on ob.id = case when k.to_business = p_business_id then k.from_business else k.to_business end
        join public.cafes oc on oc.id = ob.cafe_id
       where k.from_business = p_business_id or k.to_business = p_business_id), '[]'::json),
    'directory', coalesce((
      select json_agg(json_build_object(
               'business_id', d.id, 'name', d.name, 'district', d.district, 'category', d.category,
               'shared_customers', case when d.shared >= 5 then d.shared end) order by d.shared desc, d.name)
        from (
          select ob.id, oc.name, oc.district, oc.category,
                 coalesce((select count(distinct a.user_id)
                             from public.checkins a
                             join public.checkins b2 on b2.user_id = a.user_id
                            where a.cafe_id = v_cafe and b2.cafe_id = ob.cafe_id), 0) as shared
            from public.businesses ob
            join public.cafes oc on oc.id = ob.cafe_id
           where ob.status = 'verified' and ob.id <> p_business_id and oc.is_active
             and ob.owner_id is distinct from (select b.owner_id from public.businesses b where b.id = p_business_id)
           order by 5 desc, oc.name
           limit 60
        ) d), '[]'::json)
  );
end $$;

-- نقش کاربر دیگر را فقط صاحب یا مدیر همان شعبه می‌پرسد
create or replace function public.tl_org_role(p_business bigint, p_user uuid default null)
returns text language sql stable security definer set search_path to '' as $$
  select case
    when p_user is not null and auth.uid() is not null and p_user is distinct from auth.uid() and not public.owns_business(p_business) then null
    when b.owner_id = coalesce(p_user, auth.uid()) then 'owner'
    else (select m.role from public.org_members m where m.org_id = b.org_id and m.user_id = coalesce(p_user, auth.uid()) and m.is_active)
  end
  from public.businesses b where b.id = p_business and b.status = 'verified';
$$;

revoke all on function public.alliance_suggest(bigint), public.alliance_propose(bigint, jsonb, text), public.alliance_update_terms(bigint, bigint, jsonb),
  public.alliance_accept(bigint, bigint, integer, text), public.alliance_action(bigint, bigint, text, text), public.alliance_list_business(bigint),
  public.my_alliances(), public.org_device_add(bigint, text), public.org_device_list(bigint), public.org_device_revoke(bigint, bigint),
  public.presence_code(bigint), public.verify_presence(uuid, text), public.staff_redeem(text, text), public.alliance_platform_create(jsonb),
  public.alliance_platform_action(bigint, text), public.alliance_admin_overview(), public.alliance_affinity_rebuild()
  from public, anon;
grant execute on function public.alliance_suggest(bigint), public.alliance_propose(bigint, jsonb, text), public.alliance_update_terms(bigint, bigint, jsonb),
  public.alliance_accept(bigint, bigint, integer, text), public.alliance_action(bigint, bigint, text, text), public.alliance_list_business(bigint),
  public.my_alliances(), public.org_device_add(bigint, text), public.org_device_list(bigint), public.org_device_revoke(bigint, bigint),
  public.presence_code(bigint), public.verify_presence(uuid, text), public.staff_redeem(text, text), public.alliance_platform_create(jsonb),
  public.alliance_platform_action(bigint, text), public.alliance_admin_overview(), public.alliance_affinity_rebuild()
  to authenticated;
revoke all on function public.alliances_near(double precision, double precision, double precision), public.alliances_at_place(uuid), public.alliance_detail(bigint) from public;
grant execute on function public.alliances_near(double precision, double precision, double precision), public.alliances_at_place(uuid), public.alliance_detail(bigint) to anon, authenticated;

-- ═════════ بخش 11: خروجی تابع چک‌این v5 با مسیر و کوپن ═════════
-- همان تابع بخش 2 در فایل اول، با دو خروجی تازه trails و coupons

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
  v_trails json := '[]'::json;
  v_coupons json := '[]'::json;
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

  -- v5.0: پیشرفت مسیرها و کوپن‌هایی که همین چک‌این ساخت، از تریگر همکاری در همین تراکنش
  begin
    select coalesce(json_agg(json_build_object('id', al.id, 'title', al.title, 'kind', al.kind,
             'done', cardinality(pr.steps_done),
             'need', case when al.kind = 'event' then 1 else coalesce(al.required_steps, (select count(*) from public.alliance_steps s where s.alliance_id = al.id)) end,
             'completed', pr.status = 'done', 'deadline', pr.deadline)), '[]'::json)
      into v_trails
      from public.alliance_progress pr join public.alliances al on al.id = pr.alliance_id
     where pr.user_id = v_uid and pr.updated_at = v_now;
    select coalesce(json_agg(json_build_object('reward', k.reward_label, 'status', k.status,
             'place', (select name from public.cafes where id = k.cafe_id))), '[]'::json)
      into v_coupons
      from public.alliance_coupons k where k.user_id = v_uid and k.issued_at = v_now;
  exception when undefined_table then null;
  end;

  return json_build_object('ok', true, 'xp', v_xp, 'level', v_level, 'checkin_id', v_checkin,
    'coins', v_coins, 'streak', v_streak, 'awarded', v_award, 'is_new_cafe', v_is_new,
    'first_bonus', v_bonus, 'bonus_capped', v_capped, 'xp_capped', v_xp_cap,
    'category', v_cat, 'category_label', v_cat_name,
    'cell_key', v_cell, 'new_cell', v_new_cell, 'milestones', v_miles,
    'district', v_district, 'completed_quests', v_quests, 'rank', v_rank,
    'trails', v_trails, 'coupons', v_coupons);
end
$function$;
revoke all on function public.checkin_v5(uuid, double precision, double precision, double precision) from public, anon;
grant execute on function public.checkin_v5(uuid, double precision, double precision, double precision) to authenticated;

-- آزمون‌ها با تراکنش برگشتی در 27 اکتبر 2026 گذشت: پیشنهاد، شرایط متقابل، پذیرش نسخه، کلید تکرارناپذیر، مسیر دوقدمی،
-- کوپن دو طرف، کارمند و تأیید کوپن، کد حضور، توقف خودکار بودجه و ادامه، بازگشت متقابل، مسیر شهری مالک و دسترسی‌ها.
