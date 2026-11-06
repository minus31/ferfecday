import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { getAdmin } from "./database";

export function normalizeNickname(value: unknown) {
  if (typeof value !== "string") return null;
  const nickname = value.trim().normalize("NFC").toLowerCase();
  return /^[a-z0-9_가-힣]{2,16}$/u.test(nickname) ? nickname : null;
}

function internalEmail() {
  return `${randomUUID()}@users.ferfecday.vercel.app`;
}

function publicAuth() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("계정 서비스 설정을 확인해 주세요.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function nicknameAvailable(nickname: string) {
  if (nickname === "brith") return false;
  const { data, error } = await getAdmin().from("birthdaygift_nicknames")
    .select("nickname_key").eq("nickname_key", nickname).maybeSingle();
  if (error) throw new Error("닉네임 중복 확인을 완료하지 못했습니다.");
  return !data;
}

export async function signupNickname(nickname: string, password: string) {
  if (!(await nicknameAvailable(nickname))) return { error: "이미 사용 중인 닉네임입니다.", status: 409 };
  const admin = getAdmin();
  const email = internalEmail();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { birthdaygift_nickname: nickname },
  });
  if (error || !data.user) {
    if (error?.status === 422) return { error: "이미 사용 중인 닉네임입니다.", status: 409 };
    throw new Error("계정을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  const { error: saveError } = await admin.from("birthdaygift_nicknames").insert({
    nickname_key: nickname, user_id: data.user.id, internal_email: email,
  });
  if (saveError) {
    await admin.auth.admin.deleteUser(data.user.id);
    if (saveError.code === "23505") return { error: "이미 사용 중인 닉네임입니다.", status: 409 };
    throw new Error("계정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  return loginNickname(nickname, password);
}

export async function loginNickname(nickname: string, password: string) {
  if (nickname === "brith" && (process.env.TEST_ACCOUNT_ENABLED !== "true" || password !== "1234"))
    return { error: "닉네임 또는 비밀번호를 확인해 주세요.", status: 401 };
  let email = "brith@day.com";
  if (nickname !== "brith") {
    const { data, error } = await getAdmin().from("birthdaygift_nicknames")
      .select("internal_email").eq("nickname_key", nickname).maybeSingle();
    if (error) throw new Error("계정 조회를 완료하지 못했습니다.");
    if (!data) return { error: "닉네임 또는 비밀번호를 확인해 주세요.", status: 401 };
    email = data.internal_email;
  }
  const secret = nickname === "brith" && process.env.TEST_ACCOUNT_ENABLED === "true" && password === "1234"
    ? process.env.TEST_ACCOUNT_PASSWORD : password;
  if (!secret) return { error: "닉네임 또는 비밀번호를 확인해 주세요.", status: 401 };
  const { data, error } = await publicAuth().auth.signInWithPassword({ email, password: secret });
  if (error || !data.session ||
    (nickname === "brith" && (process.env.TEST_ACCOUNT_ENABLED !== "true" || data.user.app_metadata.birthdaygift_demo !== true)))
    return { error: "닉네임 또는 비밀번호를 확인해 주세요.", status: 401 };
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}
