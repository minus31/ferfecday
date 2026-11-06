/** 배포된 정적 앱과 보호 API를 함께 검증한다. 만든 테스트 계정은 종료 시 삭제한다. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { getAdmin } from "../lib/server/database";

const baseURL = process.env.LIVE_APP_URL || "https://ferfecday.vercel.app";
const nickname = `테스트${randomBytes(4).toString("hex")}`;
const password = randomBytes(24).toString("base64url");
const browser = await chromium.launch();
const page = await browser.newPage({ baseURL });
page.setDefaultNavigationTimeout(90000);
page.on("response", (response) => {
  if (response.url().includes("/api/service")) {
    const action = JSON.parse(response.request().postData() || "{}").action;
    console.log("service", action, response.status());
  }
});
try {
  await page.goto("/account?mode=signup&from=2024-02-28&to=2024-03-01&gender=F&location=서울", { waitUntil: "domcontentloaded" });
  await page.getByLabel("닉네임", { exact: true }).fill(nickname);
  await page.getByRole("button", { name: "닉네임 중복 확인" }).click();
  await expect(page.getByText("사용할 수 있는 닉네임입니다.")).toBeVisible();
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  await page.getByRole("button", { name: "가입하고 계속하기" }).click();
  await expect(page).toHaveURL(/\/results\?search=/, { timeout: 90000 });
  await expect(page.getByRole("heading", { name: "Best 10" })).toBeVisible();
  await page.goto("/history", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("2024-02-28 ~ 2024-03-01")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/account/, { timeout: 30000 });
  await page.getByLabel("닉네임", { exact: true }).fill(nickname);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/history/, { timeout: 60000 });
  await expect(page.getByText("2024-02-28 ~ 2024-03-01")).toBeVisible({ timeout: 30000 });
  console.log("PASS: deployed browser signup, login, session, search history");
} finally {
  await browser.close();
  const { data, error } = await getAdmin().from("birthdaygift_nicknames")
    .select("user_id").eq("nickname_key", nickname).maybeSingle();
  assert.ifError(error);
  if (data) {
    const removed = await getAdmin().auth.admin.deleteUser(data.user_id);
    assert.ifError(removed.error);
  }
}
