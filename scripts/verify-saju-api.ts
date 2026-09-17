import assert from "node:assert/strict";
import {
  createService,
  isAllowedOrigin,
  parseSearchInput,
} from "../lib/server/service";
import {
  buildProductReport,
  validateProductReport,
  INTERNAL_COPY,
} from "../lib/saju/product-report";
import {
  POLICY_VERSION,
  type SearchView,
  type ReportView,
} from "../lib/product";
import {
  PRODUCT_INSTRUCTIONS,
  extractResponseJson,
  resolveAIProvider,
  generateReport,
  generateImage,
  buildImagePrompt,
} from "../lib/server/generation";
import { memoryDatabase, TEST_USERS } from "./product-test-fixtures";
import { authenticate } from "../lib/server/database";
const state = memoryDatabase();
let reportCalls = 0,
  imageCalls = 0;
const handler = createService({
  database: () => state.db,
  authenticate: async (request) =>
    TEST_USERS[
      request.headers.get("Authorization")?.replace("Bearer ", "") || ""
    ] || null,
  report: async (day) => {
    reportCalls++;
    return buildProductReport(day);
  },
  image: async () => {
    imageCalls++;
    return new Uint8Array([1, 2, 3]);
  },
});
async function request(
  body: Record<string, unknown>,
  user = "test-user-a",
  origin = "http://localhost:3000",
) {
  return handler(
    new Request("http://localhost/api/service", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user}`,
        Origin: origin,
      },
      body: JSON.stringify(body),
    }),
  );
}
const input = {
  from: "2024-02-28",
  to: "2024-03-01",
  gender: "M",
  location: "서울",
};
assert.equal((await request({ action: "search-list" }, "missing")).status, 401);
assert.equal(
  (
    await request(
      { action: "search-list" },
      "test-user-a",
      "https://evil.example",
    )
  ).status,
  403,
);
assert.equal(
  isAllowedOrigin("https://ferfecday-preview-123.vercel.app"),
  false,
);
assert.equal((await request({ action: "search-create", input })).status, 400);
for (const invalid of [
  null,
  {},
  { ...input, from: 123 },
  { ...input, to: "2024-03-02" },
  { ...input, gender: "x" },
  { ...input, from: "2024-02-30" },
])
  assert.throws(() => parseSearchInput(invalid));
const created = await request({
  action: "search-create",
  input,
  policyVersion: POLICY_VERSION,
});
assert.equal(created.status, 200);
const search = (await created.json()) as SearchView;
assert.equal(search.result.results.length, 10);
assert.equal(search.unlocked, false);
assert.equal(
  (await request({ action: "search-get", searchId: search.id }, "test-user-b"))
    .status,
  404,
);
assert.deepEqual(
  (await (await request({ action: "search-list" }, "test-user-b")).json())
    .searches,
  [],
);
const day = search.result.results[0];
assert.equal(
  (
    await request({
      action: "report",
      searchId: search.id,
      candidateId: "fake",
    })
  ).status,
  404,
);
const report = (await (
  await request({ action: "report", searchId: search.id, candidateId: day.id })
).json()) as ReportView;
assert.equal(report.sections.length, 1);
assert.equal(report.lockedSections.length, 11);
assert.equal(report.periods.length, day.daewoon.length);
assert.equal(reportCalls, 1);
const full = buildProductReport(day);
assert.ok(validateProductReport(full, day));
assert.ok(!JSON.stringify(report).includes(full.sections[1].body));
await request({ action: "report", searchId: search.id, candidateId: day.id });
assert.equal(reportCalls, 1);
const order = await (
  await request({ action: "checkout", searchId: search.id })
).json();
assert.equal(order.amount, 3900);
assert.equal(order.status, "not-configured");
assert.equal(state.entitlements.size, 0);
assert.equal(
  (await (await request({ action: "checkout", searchId: search.id })).json())
    .orderId,
  order.orderId,
);
// 향후 결제 서버가 부여할 권리를 재현. 클라이언트에서 부여하는 API는 없다.
state.entitlements.add(`a:${search.id}`);
const paid = await (
  await request({ action: "report", searchId: search.id, candidateId: day.id })
).json();
assert.equal(paid.sections.length, 12);
assert.equal(paid.unlocked, true);
assert.equal(reportCalls, 1);
const second = search.result.results[1];
assert.equal(
  (
    await (
      await request({
        action: "report",
        searchId: search.id,
        candidateId: second.id,
      })
    ).json()
  ).sections.length,
  12,
);
const another = await (
  await request({
    action: "search-create",
    input,
    policyVersion: POLICY_VERSION,
  })
).json();
assert.equal(another.unlocked, false);
const image = await (
  await request({ action: "image", searchId: search.id, candidateId: day.id })
).json();
assert.equal(image.status, "ready");
await request({ action: "image", searchId: search.id, candidateId: day.id });
assert.equal(imageCalls, 1);
const same = search.result.results.find(
  (d) => d.id !== day.id && d.dayPillar === day.dayPillar,
);
if (same) {
  await request({ action: "image", searchId: search.id, candidateId: same.id });
  assert.equal(imageCalls, 1);
}
const demo = await (
  await request(
    { action: "search-create", input, policyVersion: POLICY_VERSION },
    "test-user-demo",
  )
).json();
assert.equal(demo.unlocked, true);
assert.equal(
  (
    await (
      await request(
        {
          action: "report",
          searchId: demo.id,
          candidateId: demo.result.results[0].id,
        },
        "test-user-demo",
      )
    ).json()
  ).sections.length,
  12,
);
assert.equal(
  (
    await request(
      { action: "account-delete", confirm: "DELETE" },
      "test-user-demo",
    )
  ).status,
  403,
);
assert.equal((await request({ action: "account-delete" })).status, 400);
assert.equal(
  (await request({ action: "account-delete", confirm: "DELETE" })).status,
  200,
);
assert.equal(
  (await request({ action: "search-get", searchId: search.id })).status,
  404,
);
assert.match(PRODUCT_INSTRUCTIONS, /한 번의 응답/);
assert.match(PRODUCT_INSTRUCTIONS, /900~1700자/);
assert.match(PRODUCT_INSTRUCTIONS, /19세 이후/);
assert.equal(extractResponseJson({ output_text: "bad" }), null);
assert.deepEqual(
  extractResponseJson({
    output: [{ content: [{ type: "output_text", text: '{"ok":true}' }] }],
  }),
  { ok: true },
);
assert.equal(resolveAIProvider({}), null);
assert.equal(
  resolveAIProvider({ OPENAI_API_KEY: "test" })?.url,
  "https://api.openai.com/v1/responses",
);
assert.match(buildImagePrompt(day.dayPillar), /Square/);
// 실제 비용 없이 OpenAI 요청 형식, 단일 호출, 검증 실패 대체를 확인한다.
const originalFetch = globalThis.fetch,
  originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = "test-only";
let calls = 0;
try {
  globalThis.fetch = async (_url, init) => {
    calls++;
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.store, false);
    assert.equal(payload.text.format.type, "json_schema");
    assert.equal(
      payload.text.format.schema.properties.periods.minItems,
      day.daewoon.length,
    );
    return Response.json({ output_text: JSON.stringify(full) });
  };
  assert.equal((await generateReport(day)).source, "ai");
  assert.equal(calls, 1);
  globalThis.fetch = async () =>
    Response.json({
      output_text: JSON.stringify({
        ...full,
        sections: full.sections.map((s, i) =>
          i ? s : { ...s, body: s.body + " SI 0.3" },
        ),
      }),
    });
  assert.equal((await generateReport(day)).source, "local");
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.size, "1024x1024");
    assert.equal(payload.n, 1);
    return Response.json({
      data: [{ b64_json: Buffer.from("png-test").toString("base64") }],
    });
  };
  assert.equal(
    Buffer.from((await generateImage(day.dayPillar))!).toString(),
    "png-test",
  );
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey) process.env.OPENAI_API_KEY = originalKey;
  else delete process.env.OPENAI_API_KEY;
}
assert.ok(!INTERNAL_COPY.test(full.sections.map((s) => s.body).join("\n")));
// 운영 인증 함수가 검증된 사용자와 활성 세션, 관리자 메타데이터를 모두 요구하는지 검사.
const envBefore = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TEST_ACCOUNT_ENABLED: process.env.TEST_ACCOUNT_ENABLED,
};
process.env.SUPABASE_URL = "https://auth-test.example";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key";
process.env.TEST_ACCOUNT_ENABLED = "true";
let active = true,
  privileged = false,
  verified = true;
const sessionId = "44444444-4444-4444-8444-444444444444";
const authToken = `header.${Buffer.from(JSON.stringify({ session_id: sessionId })).toString("base64url")}.signature`;
try {
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("/auth/v1/user"))
      return verified
        ? Response.json({
            id: "owner",
            email: "brith@day.com",
            app_metadata: { birthdaygift_demo: privileged },
            user_metadata: { birthdaygift_demo: true },
          })
        : Response.json({ msg: "Invalid token" }, { status: 401 });
    assert.ok(String(url).endsWith("/rpc/birthdaygift_session_active"));
    assert.deepEqual(JSON.parse(String(init?.body)), {
      session_id: sessionId,
      owner_id: "owner",
    });
    return Response.json(active);
  };
  const req = new Request("http://localhost", {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.equal(
    (await authenticate(req))?.demo,
    false,
    "사용자 수정 메타데이터만으로는 예외 권한을 받을 수 없어야 합니다.",
  );
  privileged = true;
  assert.equal((await authenticate(req))?.demo, true);
  process.env.TEST_ACCOUNT_ENABLED = "false";
  assert.equal((await authenticate(req))?.demo, false);
  active = false;
  assert.equal(await authenticate(req), null);
  active = true;
  verified = false;
  assert.equal(await authenticate(req), null);
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(envBefore)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
// 동시에 도착하는 동일 후보 요청은 한 번만 생성한다.
const concurrentState = memoryDatabase();
await concurrentState.db.saveSearch(another);
let releaseGeneration!: () => void;
const generationWait = new Promise<void>((resolve) => {
  releaseGeneration = resolve;
});
let simultaneousCalls = 0;
const concurrentHandler = createService({
  database: () => concurrentState.db,
  authenticate: async () => TEST_USERS["test-user-a"],
  report: async (day) => {
    simultaneousCalls++;
    await generationWait;
    return buildProductReport(day);
  },
  image: async () => null,
});
const concurrentRequest = () =>
  concurrentHandler(
    new Request("http://localhost/api/service", {
      method: "POST",
      body: JSON.stringify({
        action: "report",
        searchId: another.id,
        candidateId: another.result.results[0].id,
      }),
    }),
  );
const firstRequest = concurrentRequest();
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal((await concurrentRequest()).status, 202);
releaseGeneration();
assert.equal((await firstRequest).status, 200);
assert.equal((await concurrentRequest()).status, 200);
assert.equal(simultaneousCalls, 1);
console.log(
  "PASS: 인증, 소유권, 입력 검증, 무료 본문 제한, 검색 단위 열람권, 테스트 계정, 이미지 재사용, 단일 AI 호출, 실패 대체, 탈퇴",
);
