import type { Session } from "@supabase/supabase-js";
import { calculateLuckyDays } from "./lucky-days";
import {
  REPORT_PRICE,
  REPORT_VERSION,
  projectReport,
  type SavedSearch,
  type SearchInput,
} from "./product";
import { buildProductReport } from "./saju/product-report";

const SESSION_KEY = "birthdaygift-local-test-session-v1";
const SEARCHES_KEY = "birthdaygift-local-test-searches-v1";
const SESSION_EVENT = "birthdaygift-local-test-session-change";
const TEST_EMAIL = "brith@day.com";
const TEST_PASSWORD = "1234";
const MAX_SEARCHES = 20;

export function isLocalTestAccountEnabled() {
  return process.env.NEXT_PUBLIC_LOCAL_TEST_ACCOUNT === "true";
}

export function getLocalTestAccountCredentials() {
  return isLocalTestAccountEnabled()
    ? { email: TEST_EMAIL, password: TEST_PASSWORD }
    : null;
}

export function getLocalTestAccountSession(): Session | null {
  if (
    !isLocalTestAccountEnabled() ||
    typeof window === "undefined" ||
    localStorage.getItem(SESSION_KEY) !== TEST_EMAIL
  )
    return null;
  return {
    access_token: "local-test-account",
    refresh_token: "local-test-account",
    expires_in: 31_536_000,
    expires_at: Math.floor(Date.now() / 1000) + 31_536_000,
    token_type: "bearer",
    user: {
      id: "local-test-account",
      aud: "authenticated",
      role: "authenticated",
      email: TEST_EMAIL,
      app_metadata: { provider: "local-test" },
      user_metadata: {},
      created_at: new Date(0).toISOString(),
    },
  };
}

export function hasLocalTestAccountSession() {
  return getLocalTestAccountSession() !== null;
}

function notifySessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function authenticateLocalTestAccount(email: string, password: string) {
  if (
    !isLocalTestAccountEnabled() ||
    email.toLowerCase() !== TEST_EMAIL ||
    password !== TEST_PASSWORD
  )
    return false;
  localStorage.setItem(SESSION_KEY, TEST_EMAIL);
  notifySessionChange();
  return true;
}

export function signOutLocalTestAccount() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
}

export function onLocalTestAccountChange(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(SEARCHES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeSearches(searches: SavedSearch[]) {
  localStorage.setItem(
    SEARCHES_KEY,
    JSON.stringify(searches.slice(0, MAX_SEARCHES)),
  );
}

function getOwnedSearch(searchId: unknown) {
  if (typeof searchId !== "string")
    throw new Error("검색 번호가 올바르지 않습니다.");
  const search = readSearches().find((item) => item.id === searchId);
  if (!search)
    throw new Error(
      "이 브라우저에 저장된 테스트 검색 기록을 찾을 수 없습니다.",
    );
  return search;
}

/** Supabase 연결 전 로컬 테스트 계정의 화면 흐름만 검증한다. */
export async function localTestAccountRequest<T>(
  action: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!hasLocalTestAccountSession())
    throw new Error("로컬 테스트 계정으로 로그인해 주세요.");

  if (action === "consent") return { ok: true } as T;
  if (action === "search-create") {
    const input = body.input as SearchInput;
    const search: SavedSearch = {
      id: crypto.randomUUID(),
      userId: "local-test-account",
      createdAt: new Date().toISOString(),
      input,
      result: calculateLuckyDays(input),
    };
    writeSearches([search, ...readSearches()]);
    return { ...search, unlocked: true } as T;
  }
  if (action === "search-list") {
    return {
      searches: readSearches().map((search) => ({
        id: search.id,
        createdAt: search.createdAt,
        input: search.input,
        location: search.result.location.label,
        count: search.result.results.length,
        unlocked: true,
      })),
      nextCursor: null,
    } as T;
  }
  if (action === "account-delete") {
    localStorage.removeItem(SEARCHES_KEY);
    return { ok: true } as T;
  }

  const search = getOwnedSearch(body.searchId);
  if (action === "search-get") return { ...search, unlocked: true } as T;
  if (action === "checkout") {
    return {
      status: "unlocked",
      amount: REPORT_PRICE,
      currency: "KRW",
      provider: "local-test",
      message: "테스트 계정은 결제 없이 전체 보고서를 볼 수 있습니다.",
    } as T;
  }

  const candidate = search.result.results.find(
    (item) => item.id === body.candidateId,
  );
  if (!candidate) throw new Error("해당 검색의 후보를 찾을 수 없습니다.");
  if (action === "report") {
    const report = {
      ...buildProductReport(candidate),
      version: REPORT_VERSION,
    };
    return projectReport(report, true) as T;
  }
  if (action === "image") return { status: "unavailable", url: null } as T;
  throw new Error("로컬 테스트 계정에서 지원하지 않는 요청입니다.");
}
