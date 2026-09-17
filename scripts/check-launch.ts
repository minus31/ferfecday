import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile?.(".env.local");
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SERVICE_API_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_OPERATOR_NAME",
  "NEXT_PUBLIC_PRIVACY_OFFICER",
  "NEXT_PUBLIC_SUPABASE_COUNTRY",
];
const missing = required.filter((key) => !process.env[key]?.trim());
if (process.env.PRIVACY_REVIEW_COMPLETE !== "true")
  missing.push("PRIVACY_REVIEW_COMPLETE (위탁, 국가, 보유기간 실제 계약 검토)");
if (
  process.env.TEST_ACCOUNT_ENABLED === "true" &&
  (process.env.TEST_ACCOUNT_PASSWORD?.length || 0) < 24
)
  missing.push("TEST_ACCOUNT_PASSWORD (24자 이상)");
if (missing.length) {
  console.error(
    "공개 출시 전 설정이 필요합니다:\n" +
      missing.map((key) => `- ${key}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    "기본 출시 설정 확인 완료. 별도로 실제 인증, RLS, 메일 발송, AI/이미지, 정책 고지 검증 후 공개하세요. PG는 의도적으로 미연동입니다.",
  );
}
