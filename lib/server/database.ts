import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ReportBundle, SavedSearch, SearchHistoryItem } from "../product";

export interface Account {
  id: string;
  email: string;
  demo: boolean;
}
export interface Database {
  saveSearch(search: SavedSearch): Promise<void>;
  getSearch(id: string, userId: string): Promise<SavedSearch | null>;
  listSearches(userId: string, before?: string): Promise<SearchHistoryItem[]>;
  hasAccess(searchId: string, userId: string): Promise<boolean>;
  getReport(
    searchId: string,
    candidateId: string,
    version: string,
  ): Promise<ReportBundle | null>;
  saveReport(
    searchId: string,
    candidateId: string,
    report: ReportBundle,
  ): Promise<void>;
  acquire(key: string, seconds: number): Promise<string | null>;
  release(key: string, token: string): Promise<void>;
  rateLimit(key: string, limit: number, seconds: number): Promise<boolean>;
  getImage(key: string): Promise<string | null>;
  saveImage(key: string, bytes: Uint8Array): Promise<string>;
  createOrder(searchId: string, userId: string): Promise<string>;
  recordConsent(userId: string, version: string): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
}

let admin: SupabaseClient | undefined;
export function getAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("계정 저장소 연결을 준비 중입니다.");
  admin ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw new Error("저장소 요청을 완료하지 못했습니다.");
  return result.data;
}

export async function authenticate(request: Request): Promise<Account | null> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const db = getAdmin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  // getUser 검증 이후에만 검증된 토큰의 session_id를 사용한다. 로그아웃 즉시 폐기 확인.
  let sessionId: unknown;
  try {
    sessionId = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    ).session_id;
  } catch {
    return null;
  }
  if (typeof sessionId !== "string") return null;
  const active = checked(
    await db.rpc("birthdaygift_session_active", {
      session_id: sessionId,
      owner_id: data.user.id,
    }),
  );
  if (!active) return null;
  return {
    id: data.user.id,
    email: data.user.email || "",
    demo:
      process.env.TEST_ACCOUNT_ENABLED === "true" &&
      data.user.email === "brith@day.com" &&
      data.user.app_metadata.birthdaygift_demo === true,
  };
}

export function createDatabase(): Database {
  const db = getAdmin();
  return {
    async saveSearch(search) {
      checked(
        await db.from("birthdaygift_searches").insert({
          id: search.id,
          user_id: search.userId,
          input: search.input,
          result: search.result,
          created_at: search.createdAt,
        }),
      );
    },
    async getSearch(id, userId) {
      const row = checked(
        await db
          .from("birthdaygift_searches")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle(),
      );
      return row
        ? {
            id: row.id,
            userId: row.user_id,
            input: row.input,
            result: row.result,
            createdAt: row.created_at,
          }
        : null;
    },
    async listSearches(userId, before) {
      let query = db
        .from("birthdaygift_searches")
        .select("id,created_at,input,location_label,candidate_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (before) query = query.lt("created_at", before);
      const rows = checked(await query);
      return (rows || []).map((row) => ({
        id: row.id,
        input: row.input,
        location: row.location_label,
        count: row.candidate_count,
        createdAt: row.created_at,
      }));
    },
    async hasAccess(searchId, userId) {
      const row = checked(
        await db
          .from("birthdaygift_entitlements")
          .select("search_id")
          .eq("search_id", searchId)
          .eq("user_id", userId)
          .maybeSingle(),
      );
      return Boolean(row);
    },
    async getReport(searchId, candidateId, version) {
      const row = checked(
        await db
          .from("birthdaygift_reports")
          .select("content")
          .eq("search_id", searchId)
          .eq("candidate_id", candidateId)
          .eq("version", version)
          .maybeSingle(),
      );
      return row?.content || null;
    },
    async saveReport(searchId, candidateId, report) {
      checked(
        await db.from("birthdaygift_reports").upsert(
          {
            search_id: searchId,
            candidate_id: candidateId,
            version: report.version,
            content: report,
          },
          { onConflict: "search_id,candidate_id,version" },
        ),
      );
    },
    async acquire(key, seconds) {
      return checked(
        await db.rpc("birthdaygift_acquire", {
          lock_key: key,
          ttl_seconds: seconds,
        }),
      );
    },
    async release(key, token) {
      checked(
        await db.rpc("birthdaygift_release", {
          lock_key: key,
          lock_token: token,
        }),
      );
    },
    async rateLimit(key, limit, seconds) {
      return checked(
        await db.rpc("birthdaygift_rate_limit", {
          bucket_key: key,
          max_calls: limit,
          window_seconds: seconds,
        }),
      );
    },
    async getImage(key) {
      const row = checked(
        await db
          .from("birthdaygift_images")
          .select("url")
          .eq("id", key)
          .maybeSingle(),
      );
      return row?.url || null;
    },
    async saveImage(key, bytes) {
      const path = `${key}.png`;
      checked(
        await db.storage.from("day-pillar-images").upload(path, bytes, {
          contentType: "image/png",
          upsert: true,
          cacheControl: "31536000",
        }),
      );
      const url = db.storage.from("day-pillar-images").getPublicUrl(path)
        .data.publicUrl;
      checked(await db.from("birthdaygift_images").upsert({ id: key, url }));
      return url;
    },
    async createOrder(searchId, userId) {
      checked(
        await db.from("birthdaygift_orders").upsert(
          {
            search_id: searchId,
            user_id: userId,
            amount: 3900,
            currency: "KRW",
            status: "pending",
            provider: "toss-payments",
          },
          { onConflict: "search_id,user_id", ignoreDuplicates: true },
        ),
      );
      const row = checked(
        await db
          .from("birthdaygift_orders")
          .select("id")
          .eq("search_id", searchId)
          .eq("user_id", userId)
          .single(),
      );
      if (!row) throw new Error("결제 요청을 저장하지 못했습니다.");
      return row.id;
    },
    async recordConsent(userId, version) {
      checked(
        await db
          .from("birthdaygift_consents")
          .upsert(
            { user_id: userId, version, accepted_at: new Date().toISOString() },
            { onConflict: "user_id,version" },
          ),
      );
    },
    async deleteAccount(userId) {
      checked(
        await db
          .from("birthdaygift_orders")
          .delete()
          .eq("user_id", userId)
          .eq("status", "pending"),
      );
      checked(
        await db
          .from("birthdaygift_rate_limits")
          .delete()
          .in("id", [
            `search:${userId}`,
            `report:${userId}`,
            `image:${userId}`,
          ]),
      );
      // 승인/환불된 주문은 계정 연결을 끊고 보존한다. PG 개시 시 법정 기간 후 삭제 작업을 설정한다.
      const { error } = await db.auth.admin.deleteUser(userId);
      if (error) throw new Error("계정 삭제에 실패했습니다.");
    },
  };
}
