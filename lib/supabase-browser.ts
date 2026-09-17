import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
export function getBrowserAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "계정 서비스 연결을 준비 중입니다. 잠시 후 다시 이용해 주세요.",
    );
  client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "birthdaygift-auth",
    },
  });
  return client;
}

export function getServiceEndpoint() {
  return (
    process.env.NEXT_PUBLIC_SERVICE_API_URL ||
    "https://ferfecday.vercel.app/api/service"
  );
}

export async function serviceRequest<T>(
  action: string,
  body: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const auth = getBrowserAuth();
  const { data, error } = await auth.auth.getSession();
  if (error || !data.session)
    throw new Error(
      "로그인이 필요합니다. 이전 결과 조회에서 다시 로그인해 주세요.",
    );
  const response = await fetch(getServiceEndpoint(), {
    method: "POST",
    cache: "no-store",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) await auth.auth.signOut({ scope: "local" });
    throw new Error(result.error || "요청을 처리하지 못했습니다.");
  }
  return result as T;
}
