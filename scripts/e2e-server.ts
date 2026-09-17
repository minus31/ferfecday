/** 외부 서비스와 비용 없이 브라우저 계약을 검사하는 로컬 전용 테스트 서버. */
import { createServer } from "node:http";
import { createService } from "../lib/server/service";
import { buildProductReport } from "../lib/saju/product-report";
import { memoryDatabase, TEST_USERS } from "./product-test-fixtures";
const state = memoryDatabase();
const revoked = new Set<string>();
function identity(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
      .sub as string;
  } catch {
    return "";
  }
}
function user(id: string, email: string) {
  return {
    id,
    email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
}
function session(id: string, email: string) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const payload = {
    sub: id,
    exp: expires,
    iat: expires - 3600,
    aud: "authenticated",
  };
  const token = `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.test`;
  revoked.delete(token);
  return {
    access_token: token,
    refresh_token: `refresh-${id}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expires,
    user: user(id, email),
  };
}
const handler = createService({
  database: () => state.db,
  authenticate: async (request) => {
    const token =
      request.headers.get("Authorization")?.replace("Bearer ", "") || "";
    return revoked.has(token) ? null : TEST_USERS[identity(token)] || null;
  },
  report: async (day) => buildProductReport(day),
  image: async () => null,
});
createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString();
  let body: Record<string, any> = {};
  try {
    body = JSON.parse(raw || "{}");
  } catch {}
  const origin = req.headers.origin || "http://127.0.0.1:3100";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization,apikey,content-type,x-client-info,x-supabase-api-version",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
  };
  function json(value: unknown, status = 200) {
    res.writeHead(status, headers);
    res.end(JSON.stringify(value));
  }
  if (req.method === "OPTIONS") {
    json({});
    return;
  }
  if (req.url === "/health") {
    json({ ok: true });
    return;
  }
  if (req.url?.startsWith("/auth/v1/")) {
    if (req.url.includes("logout")) {
      revoked.add((req.headers.authorization || "").replace("Bearer ", ""));
      json({});
      return;
    }
    if (req.url.includes("user")) {
      const account =
        TEST_USERS[
          identity((req.headers.authorization || "").replace("Bearer ", ""))
        ];
      json(
        account
          ? user(
              Object.keys(TEST_USERS).find(
                (key) => TEST_USERS[key] === account,
              )!,
              account.email,
            )
          : {},
        account ? 200 : 401,
      );
      return;
    }
    const email = String(body.email || "parent@example.test");
    if (body.password === "badpass!") {
      json({ msg: "Invalid login credentials" }, 400);
      return;
    }
    const id =
      email === "brith@day.com"
        ? "test-user-demo"
        : email === "other@example.test"
          ? "test-user-b"
          : "test-user-a";
    json(session(id, email));
    return;
  }
  if (body.action === "demo-login") {
    json(session("test-user-demo", "brith@day.com"));
    return;
  }
  const response = await handler(
    new Request("http://127.0.0.1:8788/api/service", {
      method: req.method,
      headers: new Headers(req.headers as Record<string, string>),
      body: raw || undefined,
    }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}).listen(8788, "127.0.0.1", () =>
  console.log("E2E fixture listening on 127.0.0.1:8788 (not production auth)"),
);
