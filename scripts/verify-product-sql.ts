import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
create table auth.users(id uuid primary key);create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz);
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit integer,allowed_mime_types text[]);`);
const sql = await readFile(
  new URL("../supabase/migrations/202609170001_product.sql", import.meta.url),
  "utf8",
);
// PGlite에서는 별도 확장 없이 내장 UUID 함수를 사용해 동일 SQL을 검증한다.
await db.exec(sql.replace("create extension if not exists pgcrypto;", ""));
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222",
  s = "33333333-3333-4333-8333-333333333333";
await db.query("insert into auth.users(id) values($1),($2)", [a, b]);
await db.query("insert into auth.sessions values($1,$2,now())", [s, a]);
async function scalar(statement: string, args: unknown[] = []) {
  return (await db.query<Record<string, unknown>>(statement, args)).rows[0]
    .result;
}
assert.equal(
  await scalar("select public.birthdaygift_session_active($1,$2) result", [
    s,
    a,
  ]),
  true,
);
assert.equal(
  await scalar("select public.birthdaygift_session_active($1,$2) result", [
    s,
    b,
  ]),
  false,
);
await db.query("update auth.sessions set created_at=now()-interval '31 days'");
assert.equal(
  await scalar("select public.birthdaygift_session_active($1,$2) result", [
    s,
    a,
  ]),
  false,
);
await db.query("delete from auth.sessions");
assert.equal(
  await scalar("select public.birthdaygift_session_active($1,$2) result", [
    s,
    a,
  ]),
  false,
);
const token = await scalar(
  "select public.birthdaygift_acquire('same',300) result",
);
assert.ok(token);
assert.equal(
  await scalar("select public.birthdaygift_acquire('same',300) result"),
  null,
);
await db.query("select public.birthdaygift_release('same',$1)", [a]);
assert.equal(
  await scalar("select public.birthdaygift_acquire('same',300) result"),
  null,
);
await db.query("select public.birthdaygift_release('same',$1)", [token]);
assert.ok(
  await scalar("select public.birthdaygift_acquire('same',300) result"),
);
assert.equal(
  await scalar("select public.birthdaygift_rate_limit('one',1,3600) result"),
  true,
);
assert.equal(
  await scalar("select public.birthdaygift_rate_limit('one',1,3600) result"),
  false,
);
await db.query(
  "update public.birthdaygift_rate_limits set expires_at=now()-interval '1 second'",
);
assert.equal(
  await scalar("select public.birthdaygift_rate_limit('one',1,3600) result"),
  true,
);
for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  for (const table of [
    "searches",
    "reports",
    "entitlements",
    "orders",
    "consents",
    "images",
  ]) {
    await assert.rejects(
      db.query(`select * from public.birthdaygift_${table}`),
    );
  }
  await assert.rejects(
    db.query("select public.birthdaygift_session_active($1,$2)", [s, a]),
  );
  await db.exec("reset role");
}
await db.query(
  "insert into public.birthdaygift_searches(id,user_id,input,result) values($1,$2,'{}','{}')",
  [s, a],
);
await db.query(
  "insert into public.birthdaygift_reports values($1,'candidate','v1','{}')",
  [s],
);
await db.query(
  "insert into public.birthdaygift_orders(search_id,user_id,amount,currency,status,provider,payment_key) values($1,$2,3900,'KRW','paid','test','verified-payment')",
  [s, a],
);
await db.query("delete from auth.users where id=$1", [a]);
const retained = (
  await db.query<{ user_id: string | null; search_id: string | null }>(
    "select user_id,search_id from public.birthdaygift_orders",
  )
).rows[0];
assert.equal(retained.user_id, null);
assert.equal(retained.search_id, null);
assert.equal(
  await scalar(
    "select count(*)::integer result from public.birthdaygift_reports",
  ),
  0,
);
await db.close();
console.log(
  "PASS: PostgreSQL migration, RLS privileges, active session/30day expiry/revocation, lock ownership, rate-limit expiry, deletion cascade (PGlite, live Supabase not exercised)",
);
