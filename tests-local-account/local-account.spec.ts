import { expect, test } from "@playwright/test";

test("로컬 테스트 계정으로 로그인해 결과와 이전 기록을 확인한다", async ({
  page,
}) => {
  const forbidden: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("127.0.0.1:3999") ||
      request.url().includes("supabase.co")
    )
      forbidden.push(request.url());
  });

  await page.goto(
    "/account?mode=signup&from=2024-02-28&to=2024-03-01&gender=F&location=서울",
  );
  await expect(page.getByLabel("이메일", { exact: true })).toHaveValue(
    "brith@day.com",
  );
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue(
    "1234",
  );
  await expect(page.getByText("임시 계정 없는 미리보기")).toHaveCount(0);
  for (const checkbox of await page.getByRole("checkbox").all())
    await checkbox.check();
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/results\?search=/);
  await expect(page.getByRole("heading", { name: "Best 10" })).toBeVisible();
  await expect(
    page.getByText("이 검색의 전체 해설을 열람할 수 있습니다."),
  ).toBeVisible();
  await page.getByRole("button", { name: "상세 보고서 보기" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("details")).toHaveCount(22);
  await expect(dialog.getByRole("button", { name: /3,900원/ })).toHaveCount(0);

  await page.goto("/history");
  await expect(page.getByText("brith@day.com")).toBeVisible();
  await expect(page.getByText("2024-02-28 ~ 2024-03-01")).toBeVisible();
  await page.reload();
  await expect(page.getByText("2024-02-28 ~ 2024-03-01")).toBeVisible();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/history/);
  await expect(page.getByText("2024-02-28 ~ 2024-03-01")).toBeVisible();
  expect(forbidden).toEqual([]);
});
