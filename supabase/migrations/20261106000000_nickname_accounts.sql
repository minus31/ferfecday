-- 닉네임은 서버 전용 등록부에서 고유하게 관리한다. 인증 메일 주소는 내부 식별자다.
create table public.birthdaygift_nicknames (
  nickname_key text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  internal_email text not null unique,
  created_at timestamptz not null default now(),
  constraint birthdaygift_nickname_format check (nickname_key ~ '^[a-z0-9_가-힣]{2,16}$')
);
alter table public.birthdaygift_nicknames enable row level security;
revoke all on public.birthdaygift_nicknames from anon, authenticated;
grant all on public.birthdaygift_nicknames to service_role;
