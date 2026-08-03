# 생일선물 (BirthdayGift) - find the perfect day for your baby.

- Give the best day your baby. 

## PRD

### 서비스 제공
- 사주에 근거해서 출생 택일 기능을 제공함. 
- 홈화면에서, Start-day ~ End-day 를 선택 (최대 3일 기간)
- 남아/여아와 출산 지역 텍스트를 입력한다.
- 선택된 기간동안의 길일 Best 3을 계산한다.
- 길일 카드를 클릭하면 팝업하여 길일에 대한 디테일한 정보를 제공한다.

### 배포 스택 (v1)

- 채널 
    - 웹사이트 
    - App in toss를 통해 App 형태로도 제공

- 광고 
    - Google Admob
    - Meta

별도의 Backend 서버 없이, 정적 Next.js 앱으로 시작한다. Toss 미니앱 배포는 `ait build` 산출물을 사용한다.

### AI 사주 해석 연결

- 상세 리포트는 `NEXT_PUBLIC_SAJU_REPORT_API_URL`이 설정되면 해당 보호 API에 사주 데이터를 POST한다.
- 요청 모델은 `gpt-5.5`이며 응답은 `overview`, `dayPillar`, `structure`, `talent`, `parenting`, `lifeFlow` 문자열을 반환한다. 기존 4개 필드만 반환해도 로컬의 재능·양육 해설을 유지한다.
- OpenAI API 키는 정적 앱에 넣지 않는다. Supabase Edge Function 등 서버 측 보호 API에서만 관리한다.
- URL이 없거나 호출에 실패하면 화면은 내장 기본 해설을 사용한다.

| Layer | 선택 | 비고 |
| --- | --- | --- |
| Frontend | Next.js App Router static export | 브라우저 내 후보 생성 및 scoring |
| Mini app | Apps in Toss | `@apps-in-toss/web-framework`, `ait build` |
| Hosting / CDN | Vercel 또는 Toss 배포 | 웹/미니앱 채널 병행 |
| Database | Supabase Postgres | RLS(Row Level Security) 로 권한 제어 |
| Auth | Supabase Auth | 이메일/소셜 로그인, JWT 기반 세션 |
| Storage | Supabase Storage | 이미지 등 파일 업로드 |
| Realtime | Supabase Realtime | 필요 시 구독 기반 실시간 업데이트 |

### 데이터 흐름

- Client (Next.js static export)에서 후보 생성 및 scoring 수행
- 향후 민감하거나 서버에서만 처리해야 하는 로직은 별도 API/Edge Function으로 이관
- Vercel 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 관리

### 향후 확장 여지
- 무거운 작업은 Supabase Edge Functions 또는 Vercel Cron / Queue 로 이관
