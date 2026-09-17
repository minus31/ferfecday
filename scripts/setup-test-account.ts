import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile?.(".env.local");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY,
  password = process.env.TEST_ACCOUNT_PASSWORD;
if (!url || !key || !password || password.length < 24 || password === "1234")
  throw new Error(
    "전용 Supabase URL, 서비스 키, 24자 이상의 TEST_ACCOUNT_PASSWORD를 .env.local에 설정해 주세요.",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// 페이지별로 찾아 중복 생성을 피한다. 기존 일반 계정을 임의로 테스트 계정으로 승격하지 않는다.
let found: { id: string; app_metadata: Record<string, unknown> } | undefined;
for (let page = 1; page <= 100; page++) {
  const { data, error } = await db.auth.admin.listUsers({
    page,
    perPage: 1000,
  });
  if (error) throw error;
  found = data.users.find((user) => user.email === "brith@day.com");
  if (found || data.users.length < 1000) break;
}
if (found) {
  if (found.app_metadata.birthdaygift_demo !== true)
    throw new Error(
      "같은 이메일의 일반 계정이 있습니다. 소유권 확인 없이 테스트 권한을 부여하지 않습니다.",
    );
  const { error } = await db.auth.admin.updateUserById(found.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
} else {
  const { error } = await db.auth.admin.createUser({
    email: "brith@day.com",
    password,
    email_confirm: true,
    app_metadata: { birthdaygift_demo: true },
  });
  if (error) throw error;
}
console.log(
  "테스트 계정 준비 완료. 동일 비밀 값을 서버에 설정하고 TEST_ACCOUNT_ENABLED=true일 때만 brith@day.com / 1234로 이용할 수 있습니다. 비밀 값은 출력하지 않습니다.",
);
