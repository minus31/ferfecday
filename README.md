# ferfecday - find the perfect day for your baby. 

- Give the best day your baby. 

## PRD

### 서비스 제공
- 사주에 근거해서 출생 택일 기능을 제공함. 
- 홈화면에서, Start-day ~ End-day 를 선택 (최대 2주 기간)
- 선택된 기간동안의 길일을 찾아. Best 1을 보여줌(이때 30초 광고 보여줄예정), Best 5는 돈내거나 광고보게 할 예정 - 각 길일은 카드 형식
- 길일 카드를 클릭하면 팝업하여 길일에 대한 디테일한 정보를 제공한다.

### 배포 스택 (v1)

- 채널 
    - 웹사이트 
    - App in toss를 통해 App 형태로도 제공

- 광고 
    - Google Admob
    - Meta

별도의 Backend 서버 없이, Next.js의 서버 기능(Route Handlers / Server Actions)과 Supabase를 조합하여 시작한다.

| Layer | 선택 | 비고 |
| --- | --- | --- |
| Frontend / Server | Next.js (App Router) | UI + Route Handlers / Server Actions 로 BFF 역할 수행 |
| Hosting / CDN | Vercel | Next.js 자동 배포, Preview Deploy, Edge Network |
| Database | Supabase Postgres | RLS(Row Level Security) 로 권한 제어 |
| Auth | Supabase Auth | 이메일/소셜 로그인, JWT 기반 세션 |
| Storage | Supabase Storage | 이미지 등 파일 업로드 |
| Realtime | Supabase Realtime | 필요 시 구독 기반 실시간 업데이트 |

### 데이터 흐름

- Client (Next.js) → Supabase JS SDK 로 직접 통신 (RLS 로 보호)
- 민감하거나 서버에서만 처리해야 하는 로직은 Next.js Route Handlers / Server Actions 에서 Supabase Service Role Key 로 처리
- Vercel 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 관리

### 향후 확장 여지
- 무거운 작업은 Supabase Edge Functions 또는 Vercel Cron / Queue 로 이관
