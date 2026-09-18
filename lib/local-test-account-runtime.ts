import type { Session } from "@supabase/supabase-js";

/** 운영 빌드용 무기능 구현. 로컬 테스트 빌드에서만 실제 구현으로 교체한다. */
export function isLocalTestAccountEnabled() {
  return false;
}

export function getLocalTestAccountCredentials() {
  return null;
}

export function getLocalTestAccountSession(): Session | null {
  return null;
}

export function hasLocalTestAccountSession() {
  return false;
}

export function authenticateLocalTestAccount(
  _email: string,
  _password: string,
) {
  return false;
}

export function signOutLocalTestAccount() {}

export function onLocalTestAccountChange(_callback: () => void) {
  return () => {};
}

export async function localTestAccountRequest<T>(
  _action: string,
  _body: Record<string, unknown>,
): Promise<T> {
  throw new Error("로컬 테스트 계정이 꺼져 있습니다.");
}
