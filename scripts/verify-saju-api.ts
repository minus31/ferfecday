import assert from "node:assert/strict";

import sajuReportApi, {
  extractResponseJson,
  isAllowedOrigin,
  resolveAIProvider,
} from "@/api/saju-report";

assert.equal(isAllowedOrigin("http://localhost:3000"), true);
assert.equal(isAllowedOrigin("https://ferfecday.vercel.app"), true);
assert.equal(isAllowedOrigin("https://ferfecday-preview-123.vercel.app"), true);
assert.equal(isAllowedOrigin("https://birthdaygift.web.tossmini.com"), true);
assert.equal(isAllowedOrigin("https://example.com"), false);

const generated = {
  sections: [{ id: "selected-daewoon", icon: "route", title: "성장 흐름", body: "본문" }],
};
assert.deepEqual(extractResponseJson({ output_text: JSON.stringify(generated) }), generated);
assert.deepEqual(extractResponseJson({
  output: [{ content: [{ type: "output_text", text: JSON.stringify(generated) }] }],
}), generated);
assert.equal(extractResponseJson({ output_text: "not-json" }), null);

assert.deepEqual(resolveAIProvider({ OPENAI_API_KEY: "direct-key" }), {
  apiKey: "direct-key",
  model: "gpt-5.5",
  url: "https://api.openai.com/v1/responses",
});
assert.deepEqual(resolveAIProvider({ VERCEL_OIDC_TOKEN: "oidc-token" }), {
  apiKey: "oidc-token",
  model: "openai/gpt-5.5",
  url: "https://ai-gateway.vercel.sh/v1/responses",
});
assert.equal(resolveAIProvider({}), null);

const optionsResponse = await sajuReportApi.fetch(new Request(
  "https://ferfecday.vercel.app/api/saju-report",
  { method: "OPTIONS", headers: { Origin: "http://localhost:3000" } },
));
assert.equal(optionsResponse.status, 204);
assert.equal(optionsResponse.headers.get("access-control-allow-origin"), "http://localhost:3000");

const previousKeys = {
  openai: process.env.OPENAI_API_KEY,
  gateway: process.env.AI_GATEWAY_API_KEY,
  oidc: process.env.VERCEL_OIDC_TOKEN,
};
delete process.env.OPENAI_API_KEY;
delete process.env.AI_GATEWAY_API_KEY;
delete process.env.VERCEL_OIDC_TOKEN;
const unconfiguredResponse = await sajuReportApi.fetch(new Request(
  "https://ferfecday.vercel.app/api/saju-report",
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ task: "daewoon_child_fortune", report: {} }),
  },
));
if (previousKeys.openai) process.env.OPENAI_API_KEY = previousKeys.openai;
if (previousKeys.gateway) process.env.AI_GATEWAY_API_KEY = previousKeys.gateway;
if (previousKeys.oidc) process.env.VERCEL_OIDC_TOKEN = previousKeys.oidc;
assert.equal(unconfiguredResponse.status, 503);

console.log("Saju API verification passed.");
