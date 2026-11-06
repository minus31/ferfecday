/** 실제 ServiceAX에서 가입, 중복 차단, 로그인, 세션, 검색, 삭제를 점검한다. 테스트 계정은 마지막에 삭제한다. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { getAdmin } from "../lib/server/database";
import { handleService } from "../lib/server/api-bundle.mjs";
import { POLICY_VERSION } from "../lib/product";

const nickname = `test${randomBytes(6).toString("hex")}`;
const password = randomBytes(24).toString("base64url");
async function call(action: string, body: Record<string, unknown> = {}, token?: string) {
  const response = await handleService(new Request("https://ferfecday.vercel.app/api/service", {
    method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action, ...body }),
  }));
  return { status: response.status, body: await response.json() };
}
let created = false;
let token = "";
try {
  assert.deepEqual(await call("nickname-check", { nickname }), { status: 200, body: { available: true } });
  const signup = await call("account-signup", { nickname, password, policyVersion: POLICY_VERSION });
  assert.equal(signup.status, 200, JSON.stringify(signup.body));
  created = true;
  token = signup.body.access_token;
  assert.equal(typeof token, "string");
  assert.deepEqual(await call("nickname-check", { nickname }), { status: 200, body: { available: false } });
  assert.equal((await call("account-signup", { nickname, password, policyVersion: POLICY_VERSION })).status, 409);
  assert.equal((await call("account-login", { nickname, password: "wrong-password" })).status, 401);
  const login = await call("account-login", { nickname, password });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  token = login.body.access_token;
  const saved = await call("search-create", {
    input: { from: "2024-02-28", to: "2024-03-01", gender: "F", location: "서울" },
    policyVersion: POLICY_VERSION,
  }, token);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const history = await call("search-list", {}, token);
  assert.equal(history.status, 200, JSON.stringify(history.body));
  assert.equal(history.body.searches[0].id, saved.body.id);
  console.log("PASS: live nickname signup, duplicate guard, login, session, search history");
} finally {
  if (created) {
    if (token) await call("account-delete", { confirm: "DELETE" }, token);
    const { data } = await getAdmin().from("birthdaygift_nicknames").select("user_id").eq("nickname_key", nickname).maybeSingle();
    if (data) await getAdmin().auth.admin.deleteUser(data.user_id);
  }
}
