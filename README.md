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

### Apps in Toss 3.x

- Node.js 24 이상을 사용한다. 로컬에서는 `nvm use`로 `.nvmrc`의 버전을 적용한다.
- `npm run build`는 Next.js 정적 export와 AIT 아티팩트 생성을 차례로 실행한다.
- 보호 API를 연결할 때는 `https://birthdaygift.web.tossmini.com`, `https://birthdaygift.private-web.tossmini.com`을 CORS 허용 Origin에 등록한다.

### AI 사주 해석 연결

- 사주 해설의 품질 판단, 생성, 테스트, 후속 개선은 [`strategy_saju_explain.md`](./strategy_saju_explain.md)를 기준으로 진행한다.
- 상세 리포트는 기본적으로 `https://ferfecday.vercel.app/api/saju-report` 보호 API에 사주 데이터를 POST하며, `NEXT_PUBLIC_SAJU_REPORT_API_URL`로 다른 주소를 지정할 수 있다.
- 대운 선택 해설도 별도 API나 모델을 추가하지 않고 전체 사주 해설과 동일한 `NEXT_PUBLIC_SAJU_REPORT_API_URL`, `gpt-5.5`, `sections` 응답 계약을 사용한다.
- 대운 요청은 `task: "daewoon_child_fortune"`으로 구분하며, `sections`의 첫 항목 `body`에 정확히 2문단의 한국어 해설을 반환한다. 연령 구간에 따라 유년기, 청소년기, 성인기 주체와 생활 과제를 다르게 쓴다.
- 요청 모델은 `gpt-5.5`이며 응답은 사용자 친화적인 제목과 본문을 가진 지정 순서의 `sections` 배열 12개를 반환한다. 또래 관계와 별도로 성인기 친밀한 관계를 다루고, 건강은 질환 예측이 아닌 활동과 회복 리듬으로 제한한다. 각 항목은 `id`, `icon`, `title`, `body`를 가지며, 본문은 240~650자, 5~8문장, 2문단 기준을 통과해야 한다.
- OpenAI API 키는 정적 앱에 넣지 않는다. 서버 측 Vercel Function에서만 사용하며, 키가 없는 Vercel 배포에서는 자동 OIDC 인증을 사용한다.
- 운영 Vercel Function은 자동 제공되는 `VERCEL_OIDC_TOKEN`으로 AI Gateway의 `openai/gpt-5.5`를 호출한다. `OPENAI_API_KEY`가 설정된 환경에서는 OpenAI Responses API를 직접 사용한다.
- 로컬 오프라인 상태이거나 호출에 실패하면 화면은 계산된 사주 데이터로 만든 기본 해설을 사용한다.

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
