import { randomUUID } from "node:crypto";
import type { Database, Account } from "../lib/server/database";
import type { SavedSearch, ReportBundle } from "../lib/product";
/** 테스트 전용 저장소. 운영 API에서 이 모듈을 import하지 않는다. */
export function memoryDatabase() {
  const searches = new Map<string, SavedSearch>(),
    reports = new Map<string, ReportBundle>(),
    images = new Map<string, string>();
  const entitlements = new Set<string>(),
    locks = new Map<string, string>(),
    orders = new Map<string, string>();
  const buckets = new Map<string, { count: number; expiry: number }>();
  const consents = new Set<string>();
  const db: Database = {
    async saveSearch(search) {
      searches.set(search.id, structuredClone(search));
    },
    async getSearch(id, userId) {
      const s = searches.get(id);
      return s?.userId === userId ? structuredClone(s) : null;
    },
    async listSearches(userId, before) {
      return [...searches.values()]
        .filter((s) => s.userId === userId && (!before || s.createdAt < before))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50)
        .map((s) => ({
          id: s.id,
          createdAt: s.createdAt,
          input: s.input,
          location: s.result.location.label,
          count: s.result.results.length,
        }));
    },
    async hasAccess(searchId, userId) {
      return entitlements.has(`${userId}:${searchId}`);
    },
    async getReport(searchId, candidateId, version) {
      return reports.get(`${searchId}:${candidateId}:${version}`) || null;
    },
    async saveReport(searchId, candidateId, report) {
      reports.set(
        `${searchId}:${candidateId}:${report.version}`,
        structuredClone(report),
      );
    },
    async acquire(key) {
      if (locks.has(key)) return null;
      const token = randomUUID();
      locks.set(key, token);
      return token;
    },
    async release(key, token) {
      if (locks.get(key) === token) locks.delete(key);
    },
    async rateLimit(key, limit, seconds) {
      let b = buckets.get(key);
      if (!b || b.expiry < Date.now()) {
        b = { count: 0, expiry: Date.now() + seconds * 1000 };
        buckets.set(key, b);
      }
      return ++b.count <= limit;
    },
    async getImage(key) {
      return images.get(key) || null;
    },
    async saveImage(key) {
      const url = `https://example.test/${key}.png`;
      images.set(key, url);
      return url;
    },
    async createOrder(searchId, userId) {
      const key = `${userId}:${searchId}`;
      if (!orders.has(key)) orders.set(key, randomUUID());
      return orders.get(key)!;
    },
    async recordConsent(userId, version) {
      consents.add(`${userId}:${version}`);
    },
    async deleteAccount(userId) {
      for (const [id, s] of searches)
        if (s.userId === userId) {
          searches.delete(id);
          for (const key of reports.keys())
            if (key.startsWith(`${id}:`)) reports.delete(key);
        }
    },
  };
  return {
    db,
    searches,
    reports,
    images,
    entitlements,
    locks,
    orders,
    buckets,
    consents,
  };
}
export const TEST_USERS: Record<string, Account> = {
  "test-user-a": { id: "a", email: "parent@example.test", demo: false },
  "test-user-b": { id: "b", email: "other@example.test", demo: false },
  "test-user-demo": { id: "demo", email: "brith@day.com", demo: true },
};
