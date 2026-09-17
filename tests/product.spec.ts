import { test, expect } from "@playwright/test";
test("로그인 오류 안내와 존재하지 않는 기록 접근 차단", async ({ page }) => {
  await page.goto("/account");
  await page.getByLabel("이메일", { exact: true }).fill("other@example.test");
  await page.getByLabel("비밀번호", { exact: true }).fill("badpass!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("이메일 또는 비밀번호");
  await page.getByLabel("비밀번호", { exact: true }).fill("safe-pass-1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/history/);
  await page.goto("/results?search=22222222-2222-4222-8222-222222222222");
  await expect(
    page.getByRole("alert").filter({ hasText: "검색 기록을 찾을 수 없습니다" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "상세 보고서 보기" }),
  ).toHaveCount(0);
});
const searchQuery = "from=2024-02-28&to=2024-03-01&gender=M&location=서울";
test("가입, 과거 검색, Top10, 무료 경계, 결제 준비, 이전 결과와 로그아웃", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/account?mode=signup&${searchQuery}`);
  await page.getByLabel("이메일", { exact: true }).fill("parent@example.test");
  await page.getByLabel("비밀번호", { exact: true }).fill("safe-pass-1234");
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "가입하고 계속하기" }).click();
  await expect(page).toHaveURL(/\/results\?search=/);
  await expect(page.getByRole("heading", { name: "Best 10" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "상세 보고서 보기" }),
  ).toHaveCount(10);
  const url = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Best 10" })).toBeVisible();
  await page.getByRole("button", { name: "상세 보고서 보기" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "3,900원으로 전체 해설 열기" }),
  ).toBeVisible();
  await expect(dialog.locator("article")).toHaveCount(11);
  const body = await dialog.innerText();
  expect(body).not.toMatch(
    /SI\s|\d+(?:\.\d+)?%|생조\s*\d|극설\s*\d|가점 항목|감점 항목/,
  );
  await expect(
    dialog.getByRole("heading", { name: "신살과 길성" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "대운과 세운" }),
  ).toBeVisible();
  expect(await dialog.locator("details").count()).toBe(11);
  await dialog
    .getByRole("button", { name: "3,900원으로 전체 해설 열기" })
    .click();
  await expect(dialog.getByRole("status")).toContainText(
    "아직 결제되거나 열람 권한이 변경되지 않습니다",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("report.png"),
    fullPage: false,
  });
  await page.goBack();
  await expect(dialog).not.toBeVisible();
  await page.goto("/history");
  await expect(
    page.getByRole("heading", { name: "우리 가족의 이전 결과" }),
  ).toBeVisible();
  await page
    .locator(`a[href="${new URL(url).pathname + new URL(url).search}"]`)
    .click();
  await expect(page.getByRole("heading", { name: "Best 10" })).toBeVisible();
  await page.goto("/history");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.goto(url);
  await expect(
    page.getByRole("alert").filter({ hasText: "로그인" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("테스트 계정은 모든 장을 보고 홈에서는 과거 날짜를 선택한다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "이전 결과 조회", exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "출산 예정 기간을 선택하세요" })
    .click();
  await page.getByLabel("연도 선택").selectOption("2024");
  await page.getByLabel("월 선택").selectOption("1");
  const grid = page.getByRole("grid");
  await grid.getByRole("button", { name: /2024년 2월 28일/ }).click();
  await grid.getByRole("button", { name: /2024년 2월 29일/ }).click();
  await page.getByRole("button", { name: "길일 찾기", exact: true }).click();
  await expect(page).toHaveURL(/\/account\?mode=signup/);
  await page.getByLabel("이메일", { exact: true }).fill("brith@day.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("1234");
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "가입하고 계속하기" }).click();
  await expect(page.getByRole("heading", { name: "Best 10" })).toBeVisible();
  await page.getByRole("button", { name: "상세 보고서 보기" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("details")).toHaveCount(22);
  await expect(dialog.getByRole("button", { name: /3,900원/ })).toHaveCount(0);
  await expect(
    dialog.getByText("학업과 배움의 방식", { exact: true }),
  ).toBeVisible();
  await dialog.getByText("적성과 직업, 일하는 환경", { exact: true }).click();
  await expect(dialog.getByText(/조사, 설계, 제작, 설명, 수정/)).toBeVisible();
});
