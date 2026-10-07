-- ServiceAX migration version 20261007231117: 앱 데이터는 서버만 접근한다.
-- 프로젝트 기본 event trigger 함수는 외부 API 역할이 직접 실행할 필요가 없다.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 계정 삭제 시 외래키 탐색과 사용자별 조회를 위한 인덱스.
create index if not exists birthdaygift_entitlements_user_id_idx
  on public.birthdaygift_entitlements(user_id);
create index if not exists birthdaygift_orders_user_id_idx
  on public.birthdaygift_orders(user_id);
