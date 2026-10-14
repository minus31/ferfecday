import assert from "node:assert/strict";
import { handleService, isAllowedOrigin } from "../lib/server/api-bundle.mjs";

assert.equal(typeof handleService, "function");
assert.equal(isAllowedOrigin("https://ferfecday.vercel.app"), true);
const response = await handleService(
  new Request("https://ferfecday.vercel.app/api/service", {
    method: "POST",
    body: JSON.stringify({ action: "search-list" }),
  }),
);
assert.equal(response.status, 401);
assert.match((await response.json()).error, /로그인/);
console.log("PASS: Vercel ESM API bundle loads and rejects unauthenticated requests");
