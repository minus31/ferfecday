import { SAJU_REPORT_MODEL } from "../lib/saju/report-model";

type ReportTask = "full_saju_report" | "daewoon_child_fortune";

interface OpenAIResponse {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: unknown;
      text?: unknown;
    }>;
  }>;
}

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const VERCEL_AI_GATEWAY_RESPONSES_URL = "https://ai-gateway.vercel.sh/v1/responses";
const MAX_REQUEST_BYTES = 256_000;
const ICONS = [
  "sparkles",
  "heart",
  "brain",
  "message",
  "users",
  "shield",
  "compass",
  "wallet",
  "home",
  "route",
] as const;

const FULL_REPORT_INSTRUCTIONS = `
당신은 부모가 아이의 타고난 기질과 성장 경향을 이해하도록 돕는 한국어 사주 해설가입니다.
제공된 계산 결과만 근거로 정확히 10개의 생활형 해설을 작성하세요.
순서와 id/icon은 core/sparkles, inner-pace/heart, learning/brain, hidden-strength/message, relationships/users, challenge/shield, career/compass, money/wallet, parenting/home, life-flow/route로 고정합니다.
각 제목은 10~55자이며 관찰 가능한 아이의 특성이나 양육 시사점을 말해야 합니다.
각 본문은 정확히 2문단, 4문장 이상, 180~700자의 자연스러운 한국어로 작성하세요.
계산 근거를 쉬운 말로 해석한 뒤 가정, 학교, 놀이 중 하나의 구체적인 예시, 부모가 관찰할 신호, 시도할 행동이나 질문을 포함하세요.
SI, 기도, 용신, 희신, 일주론, 격국, 대운, 십성, 신강, 신약, 원국, 생조, 극설 같은 전문어나 내부 코드를 노출하지 마세요.
운명, 질병, 사고, 죽음, 재산 규모를 단정하거나 예언하지 말고 가능성의 언어를 사용하세요.
`.trim();

const DAEWOON_INSTRUCTIONS = `
당신은 부모가 아이의 장기적인 성장 흐름과 마음 변화를 이해하도록 돕는 한국어 사주 해설가입니다.
선택된 시기와 해당 연도들의 계산 결과만 근거로 sections 항목을 정확히 1개 작성하세요.
id는 selected-daewoon, icon은 route로 고정하고, 제목은 선택 연령대의 성장 흐름을 구체적으로 표현하세요.
본문은 1~2문단, 3~7문장, 180~700자로 작성하세요.
첫 부분에는 전반적인 흐름과 아이 내면의 욕구나 감정 변화를, 다음 부분에는 부모가 관찰할 신호와 도울 방법을 담으세요.
SI, 기도, 용신, 희신, 일주론, 격국, 대운, 십성, 신강, 신약, 원국, 생조, 극설 같은 전문어나 내부 코드를 노출하지 마세요.
운명, 질병, 사고, 죽음, 재산 규모를 단정하거나 예언하지 말고 가능성의 언어를 사용하세요.
`.trim();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      return true;
    }
    if (url.protocol !== "https:") return false;
    return url.hostname === "ferfecday.vercel.app"
      || /^ferfecday-[a-z0-9-]+\.vercel\.app$/.test(url.hostname)
      || url.hostname === "birthdaygift.web.tossmini.com"
      || url.hostname === "birthdaygift.private-web.tossmini.com";
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  });
  if (origin && isAllowedOrigin(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function reportSchema(task: ReportTask) {
  const itemCount = task === "daewoon_child_fortune" ? 1 : 10;
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      sections: {
        type: "array",
        minItems: itemCount,
        maxItems: itemCount,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            icon: { type: "string", enum: [...ICONS] },
            title: { type: "string" },
            body: { type: "string" },
          },
          required: ["id", "icon", "title", "body"],
        },
      },
    },
    required: ["sections"],
  };
}

export function extractResponseJson(response: OpenAIResponse) {
  const text = typeof response.output_text === "string"
    ? response.output_text
    : response.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text" && typeof item.text === "string")?.text;
  if (typeof text !== "string") return null;

  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    return null;
  }
}

export function resolveAIProvider(env: Record<string, string | undefined>) {
  const configuredModel = env.OPENAI_SAJU_MODEL || SAJU_REPORT_MODEL;
  if (env.OPENAI_API_KEY) {
    return {
      apiKey: env.OPENAI_API_KEY,
      model: configuredModel.replace(/^openai\//, ""),
      url: OPENAI_RESPONSES_URL,
    };
  }

  const gatewayKey = env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN;
  if (!gatewayKey) return null;
  return {
    apiKey: gatewayKey,
    model: configuredModel.includes("/") ? configuredModel : `openai/${configuredModel}`,
    url: VERCEL_AI_GATEWAY_RESPONSES_URL,
  };
}

function errorResponse(message: string, status: number, headers: Headers) {
  return Response.json({ error: message }, { status, headers });
}

export default {
  async fetch(request: Request) {
    const origin = request.headers.get("origin");
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: isAllowedOrigin(origin) ? 204 : 403, headers });
    }
    if (request.method !== "POST") return errorResponse("Method not allowed", 405, headers);
    if (!isAllowedOrigin(origin)) return errorResponse("Origin not allowed", 403, headers);

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) return errorResponse("Request is too large", 413, headers);

    const provider = resolveAIProvider(process.env);
    if (!provider) return errorResponse("AI service is not configured", 503, headers);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return errorResponse("Invalid JSON", 400, headers);
    }
    if (!isRecord(payload) || !isRecord(payload.report)) {
      return errorResponse("Invalid report payload", 400, headers);
    }

    if (payload.task !== undefined
      && payload.task !== "full_saju_report"
      && payload.task !== "daewoon_child_fortune") {
      return errorResponse("Unsupported report task", 400, headers);
    }
    const task: ReportTask = payload.task === "daewoon_child_fortune"
      ? "daewoon_child_fortune"
      : "full_saju_report";
    const serializedReport = JSON.stringify(payload.report);
    if (new TextEncoder().encode(serializedReport).byteLength > MAX_REQUEST_BYTES) {
      return errorResponse("Report is too large", 413, headers);
    }

    let openAIResponse: Response;
    try {
      openAIResponse = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          instructions: task === "daewoon_child_fortune" ? DAEWOON_INSTRUCTIONS : FULL_REPORT_INSTRUCTIONS,
          input: `다음 JSON은 이미 계산된 사주 자료입니다. 값을 다시 계산하거나 입력에 없는 사실을 만들지 마세요.\n${serializedReport}`,
          max_output_tokens: task === "daewoon_child_fortune" ? 2_500 : 14_000,
          store: false,
          text: {
            format: {
              type: "json_schema",
              name: task,
              strict: true,
              schema: reportSchema(task),
            },
          },
        }),
      });
    } catch (error) {
      console.error("OpenAI saju report request failed", error);
      return errorResponse("AI service is temporarily unavailable", 502, headers);
    }

    if (!openAIResponse.ok) {
      const detail = (await openAIResponse.text()).slice(0, 1_000);
      console.error("OpenAI saju report failed", openAIResponse.status, detail);
      return errorResponse("AI generation failed", 502, headers);
    }

    const generated = extractResponseJson(await openAIResponse.json() as OpenAIResponse);
    if (!isRecord(generated) || !Array.isArray(generated.sections)) {
      return errorResponse("Invalid AI response", 502, headers);
    }

    return Response.json(generated, { headers });
  },
};
