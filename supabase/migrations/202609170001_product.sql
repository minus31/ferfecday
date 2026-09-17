-- Supabase SQL Editor 또는 CLI migration으로 실행. 결제/해설은 브라우저 직접 접근 금지.
create extension if not exists pgcrypto;
create table public.birthdaygift_searches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
  location_label text generated always as (result->'location'->>'label') stored,
  candidate_count integer generated always as (jsonb_array_length(result->'results')) stored
);
create index on public.birthdaygift_searches(user_id, created_at desc);
create table public.birthdaygift_entitlements (
  search_id uuid primary key references public.birthdaygift_searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, granted_at timestamptz not null default now()
);
create table public.birthdaygift_reports (
  search_id uuid not null references public.birthdaygift_searches(id) on delete cascade,
  candidate_id text not null, version text not null, content jsonb not null,
  primary key(search_id, candidate_id, version)
);
create table public.birthdaygift_images (id text primary key, url text not null);
create table public.birthdaygift_orders (
  id uuid primary key default gen_random_uuid(), search_id uuid references public.birthdaygift_searches(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null, amount integer not null check(amount = 3900),
  currency text not null check(currency = 'KRW'), status text not null check(status in ('pending','paid','refunded')),
  provider text not null, payment_key text unique, created_at timestamptz not null default now(), unique(search_id,user_id)
);
create table public.birthdaygift_consents (
  user_id uuid not null references auth.users(id) on delete cascade, version text not null, accepted_at timestamptz not null default now(), primary key(user_id,version)
);
create table public.birthdaygift_locks (id text primary key, token uuid not null, expires_at timestamptz not null);
create table public.birthdaygift_rate_limits (id text primary key, count integer not null, expires_at timestamptz not null);
alter table public.birthdaygift_searches enable row level security;
alter table public.birthdaygift_entitlements enable row level security;
alter table public.birthdaygift_reports enable row level security;
alter table public.birthdaygift_images enable row level security;
alter table public.birthdaygift_orders enable row level security;
alter table public.birthdaygift_consents enable row level security;
alter table public.birthdaygift_locks enable row level security;
alter table public.birthdaygift_rate_limits enable row level security;
-- 정책 없음: service_role 서버만 접근한다. 본문은 서버에서 열람 권한에 따라 투영한다.
revoke all on public.birthdaygift_searches, public.birthdaygift_entitlements, public.birthdaygift_reports, public.birthdaygift_images, public.birthdaygift_orders, public.birthdaygift_consents, public.birthdaygift_locks, public.birthdaygift_rate_limits from anon, authenticated;
grant all on public.birthdaygift_searches, public.birthdaygift_entitlements, public.birthdaygift_reports, public.birthdaygift_images, public.birthdaygift_orders, public.birthdaygift_consents, public.birthdaygift_locks, public.birthdaygift_rate_limits to service_role;

create function public.birthdaygift_session_active(session_id uuid, owner_id uuid) returns boolean
language sql security definer set search_path = '' as $$
  select exists(select 1 from auth.sessions s where s.id = session_id and s.user_id = owner_id
    and s.created_at > now() - interval '30 days');
$$;
create function public.birthdaygift_acquire(lock_key text, ttl_seconds integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  insert into public.birthdaygift_locks(id,token,expires_at) values(lock_key,gen_random_uuid(),now()+make_interval(secs=>ttl_seconds))
  on conflict(id) do update set token=excluded.token, expires_at=excluded.expires_at where public.birthdaygift_locks.expires_at < now()
  returning token into result;
  return result;
end; $$;
create function public.birthdaygift_release(lock_key text, lock_token uuid) returns void
language sql security definer set search_path = '' as $$ delete from public.birthdaygift_locks where id=lock_key and token=lock_token; $$;
create function public.birthdaygift_rate_limit(bucket_key text, max_calls integer, window_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare hits integer;
begin
  delete from public.birthdaygift_rate_limits where expires_at < now();
  insert into public.birthdaygift_rate_limits(id,count,expires_at) values(bucket_key,1,now()+make_interval(secs=>window_seconds))
  on conflict(id) do update set count=case when public.birthdaygift_rate_limits.expires_at < now() then 1 else public.birthdaygift_rate_limits.count+1 end,
  expires_at=case when public.birthdaygift_rate_limits.expires_at < now() then excluded.expires_at else public.birthdaygift_rate_limits.expires_at end
  returning count into hits;
  return hits <= max_calls;
end; $$;
revoke all on function public.birthdaygift_session_active(uuid,uuid), public.birthdaygift_acquire(text,integer), public.birthdaygift_release(text,uuid), public.birthdaygift_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.birthdaygift_session_active(uuid,uuid), public.birthdaygift_acquire(text,integer), public.birthdaygift_release(text,uuid), public.birthdaygift_rate_limit(text,integer,integer) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('day-pillar-images','day-pillar-images',true,10485760,array['image/png']) on conflict(id) do nothing;
-- 공개 이미지는 개인 사진이 아닌 60일주 공용 삽화. 업로드 정책은 생성하지 않는다.
