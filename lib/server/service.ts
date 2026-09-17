import { randomUUID, createHash } from "node:crypto";
import { calculateLuckyDays, parseDateParam } from "../lucky-days";
import {
  POLICY_VERSION,
  REPORT_PRICE,
  REPORT_VERSION,
  projectReport,
  type SearchInput,
  type SavedSearch,
} from "../product";
import { DAY_PILLARS } from "../saju/day-pillar-profiles";
import {
  authenticate,
  createDatabase,
  type Account,
  type Database,
} from "./database";
import { generateReport, generateImage } from "./generation";

export function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  const allowed = (
    process.env.ALLOWED_ORIGINS ||
    "https://ferfecday.vercel.app,https://birthdaygift.web.tossmini.com,https://birthdaygift.private-web.tossmini.com"
  ).split(",");
  try {
    const url = new URL(origin);
    return (
      allowed.includes(url.origin) ||
      (process.env.NODE_ENV !== "production" &&
        ["localhost", "127.0.0.1"].includes(url.hostname))
    );
  } catch {
    return false;
  }
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function requireId(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      value,
    )
  )
    throw new HttpError(400, "검색 번호가 올바르지 않습니다.");
  return value;
}
export function parseSearchInput(value: unknown): SearchInput {
  const input = value as SearchInput;
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.from !== "string" ||
    typeof input.to !== "string" ||
    !parseDateParam(input.from) ||
    !parseDateParam(input.to) ||
    !["M", "F"].includes(input.gender) ||
    typeof input.location !== "string" ||
    !input.location.trim() ||
    input.location.length > 120
  )
    throw new HttpError(400, "날짜, 성별, 지역을 다시 확인해 주세요.");
  if (
    Number(input.from.slice(0, 4)) < 1900 ||
    Number(input.to.slice(0, 4)) > 2100
  )
    throw new HttpError(400, "1900년부터 2100년까지 조회할 수 있습니다.");
  const from = parseDateParam(input.from)!,
    to = parseDateParam(input.to)!;
  if (to.utc < from.utc || to.utc - from.utc > 2 * 86400000)
    throw new HttpError(400, "기간은 최대 3일까지 선택할 수 있습니다.");
  return {
    from: input.from,
    to: input.to,
    gender: input.gender,
    location: input.location.trim(),
  };
}
export interface ServiceDependencies {
  database: () => Database;
  authenticate: (request: Request) => Promise<Account | null>;
  report: typeof generateReport;
  image: typeof generateImage;
}
export function createService(deps: ServiceDependencies) {
  return async function handle(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Origin",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "X-Content-Type-Options": "nosniff",
    });
    if (origin && isAllowedOrigin(origin))
      headers.set("Access-Control-Allow-Origin", origin);
    const json = (body: unknown, status = 200) =>
      Response.json(body, { status, headers });
    if (!isAllowedOrigin(origin))
      return json({ error: "허용되지 않은 요청입니다." }, 403);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return json({ error: "POST 요청만 지원합니다." }, 405);
    try {
      if (Number(request.headers.get("content-length")) > 16000)
        throw new HttpError(413, "요청이 너무 큽니다.");
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 16000)
        throw new HttpError(413, "요청이 너무 큽니다.");
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new HttpError(400, "요청 형식을 확인해 주세요.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new HttpError(400, "요청 형식을 확인해 주세요.");
      if (body.action === "demo-login") {
        if (
          process.env.TEST_ACCOUNT_ENABLED !== "true" ||
          !process.env.TEST_ACCOUNT_PASSWORD ||
          body.email !== "brith@day.com" ||
          body.password !== "1234"
        )
          throw new HttpError(401, "이메일 또는 비밀번호를 확인해 주세요.");
        const db = deps.database();
        const address =
          request.headers.get("x-vercel-forwarded-for") ||
          request.headers.get("x-forwarded-for") ||
          "unknown";
        if (
          !(await db.rateLimit(
            `demo:${createHash("sha256").update(address).digest("hex")}`,
            10,
            900,
          ))
        )
          throw new HttpError(429, "잠시 후 다시 로그인해 주세요.");
        const { createClient } = await import("@supabase/supabase-js");
        const auth = createClient(
          process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data, error } = await auth.auth.signInWithPassword({
          email: "brith@day.com",
          password: process.env.TEST_ACCOUNT_PASSWORD,
        });
        if (
          error ||
          !data.session ||
          data.user?.app_metadata.birthdaygift_demo !== true
        )
          throw new HttpError(401, "테스트 계정이 준비되지 않았습니다.");
        return json({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      const account = await deps.authenticate(request);
      if (!account)
        throw new HttpError(
          401,
          "로그인이 만료되었습니다. 다시 로그인해 주세요.",
        );
      const db = deps.database();
      const access = (id: string) =>
        account.demo ? Promise.resolve(true) : db.hasAccess(id, account.id);
      if (body.action === "consent") {
        if (body.version !== POLICY_VERSION)
          throw new HttpError(400, "현재 약관에 동의해 주세요.");
        await db.recordConsent(account.id, POLICY_VERSION);
        return json({ ok: true });
      }
      if (body.action === "account-delete") {
        if (account.demo)
          throw new HttpError(403, "공용 테스트 계정은 삭제할 수 없습니다.");
        if (body.confirm !== "DELETE")
          throw new HttpError(400, "탈퇴 확인이 필요합니다.");
        await db.deleteAccount(account.id);
        return json({ ok: true });
      }
      if (body.action === "search-create") {
        if (body.policyVersion !== POLICY_VERSION)
          throw new HttpError(
            400,
            "개인정보 처리와 서비스 약관에 동의해 주세요.",
          );
        const input = parseSearchInput(body.input);
        if (!(await db.rateLimit(`search:${account.id}`, 30, 3600)))
          throw new HttpError(
            429,
            "검색 요청이 많습니다. 잠시 후 다시 이용해 주세요.",
          );
        const search: SavedSearch = {
          id: randomUUID(),
          userId: account.id,
          createdAt: new Date().toISOString(),
          input,
          result: calculateLuckyDays(input),
        };
        await db.recordConsent(account.id, POLICY_VERSION);
        await db.saveSearch(search);
        return json({ ...search, unlocked: account.demo });
      }
      if (body.action === "search-list") {
        if (
          body.before !== undefined &&
          (typeof body.before !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T/.test(body.before) ||
            !Number.isFinite(Date.parse(body.before)))
        )
          throw new HttpError(400, "조회 기준 시각이 올바르지 않습니다.");
        const rows = await db.listSearches(
          account.id,
          body.before as string | undefined,
        );
        return json({
          nextCursor: rows.length === 50 ? rows.at(-1)!.createdAt : null,
          searches: await Promise.all(
            rows.map(async (row) => ({
              id: row.id,
              createdAt: row.createdAt,
              input: row.input,
              location: row.location,
              count: row.count,
              unlocked: await access(row.id),
            })),
          ),
        });
      }
      const searchId = requireId(body.searchId);
      const search = await db.getSearch(searchId, account.id);
      if (!search) throw new HttpError(404, "검색 기록을 찾을 수 없습니다.");
      const unlocked = await access(searchId);
      if (body.action === "search-get") return json({ ...search, unlocked });
      if (body.action === "checkout") {
        if (unlocked) return json({ status: "unlocked", amount: REPORT_PRICE });
        const orderId = await db.createOrder(searchId, account.id);
        return json({
          status: "not-configured",
          orderId,
          amount: REPORT_PRICE,
          currency: "KRW",
          provider: "toss-payments",
          message:
            "결제 기능을 준비 중입니다. 아직 결제되거나 열람 권한이 변경되지 않습니다.",
        });
      }
      const day = search.result.results.find(
        (item) => item.id === body.candidateId,
      );
      if (!day)
        throw new HttpError(404, "해당 검색의 후보를 찾을 수 없습니다.");
      if (body.action === "report") {
        const cached = await db.getReport(searchId, day.id, REPORT_VERSION);
        if (cached) return json(projectReport(cached, unlocked));
        const key = `report:${searchId}:${day.id}:${REPORT_VERSION}`;
        const token = await db.acquire(key, 300);
        if (!token) return json({ pending: true }, 202);
        try {
          const completed = await db.getReport(
            searchId,
            day.id,
            REPORT_VERSION,
          );
          if (completed) return json(projectReport(completed, unlocked));
          if (!(await db.rateLimit(`report:${account.id}`, 40, 3600)))
            throw new HttpError(
              429,
              "해설 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
            );
          const report = await deps.report(day);
          await db.saveReport(searchId, day.id, report);
          return json(projectReport(report, unlocked));
        } finally {
          await db.release(key, token);
        }
      }
      if (body.action === "image") {
        const index = DAY_PILLARS.indexOf(
          day.dayPillar as (typeof DAY_PILLARS)[number],
        );
        if (index < 0) throw new HttpError(400, "일주를 확인할 수 없습니다.");
        const key = `portrait-v1-${index}`;
        const cached = await db.getImage(key);
        if (cached) return json({ status: "ready", url: cached });
        const token = await db.acquire(key, 240);
        if (!token) return json({ status: "pending", url: null }, 202);
        try {
          const completed = await db.getImage(key);
          if (completed) return json({ status: "ready", url: completed });
          if (!(await db.rateLimit(`image:${account.id}`, 12, 3600)))
            throw new HttpError(
              429,
              "이미지 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
            );
          const bytes = await deps.image(day.dayPillar);
          return bytes
            ? json({ status: "ready", url: await db.saveImage(key, bytes) })
            : json({ status: "unavailable", url: null });
        } finally {
          await db.release(key, token);
        }
      }
      throw new HttpError(400, "지원하지 않는 요청입니다.");
    } catch (error) {
      return json(
        {
          error:
            error instanceof HttpError
              ? error.message
              : "서비스 연결을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        },
        error instanceof HttpError ? error.status : 503,
      );
    }
  };
}
export const handleService = createService({
  database: createDatabase,
  authenticate,
  report: generateReport,
  image: generateImage,
});
