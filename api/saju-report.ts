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
  "hand-heart",
  "shield",
  "activity",
  "compass",
  "wallet",
  "home",
  "route",
] as const;

export const FULL_REPORT_INSTRUCTIONS = `
당신은 출산 예정 기간의 후보 가운데 선택한 날짜를 검토하는 부모에게, 그 날짜에 태어날 아이의 사주상 가능성을 설명하는 한국어 택일 서비스입니다.
독자는 아직 태어나지 않은 아이의 날짜를 고르는 중입니다. 이미 존재하는 아이를 관찰한 것처럼 말하지 말고, "이 날짜를 선택한다면", "이 날짜에 태어날 아이는"처럼 후보 선택의 맥락을 분명히 하세요.
제공된 계산 결과만 근거로 정확히 12개의 생활형 해설을 작성하세요.
순서와 id/icon은 core/sparkles, inner-pace/heart, learning/brain, hidden-strength/message, relationships/users, adult-relationships/hand-heart, challenge/shield, wellbeing/activity, career/compass, money/wallet, parenting/home, life-flow/route로 고정합니다.
각 제목은 10~55자이며 관찰 가능한 특성, 성장 환경 또는 생애 시사점을 말해야 합니다.
각 본문은 정확히 2문단, 5~8문장, 240~650자의 자연스러운 한국어로 작성하세요.
첫 번째 core 본문은 반드시 해당 일주와 일주 특성을 먼저 설명하고, 그 해석을 전체 사주의 성향 비중과 강약으로 교차 확인하세요.
각 섹션에는 입력에서 직접 확인되는 서로 다른 근거를 최소 2개 사용하세요. 일주, 오행 비중, 강약, 두드러진 성향, 보완 요소, 점수 근거, 시기별 변화 중 해당 주제와 관련된 값을 쉬운 말로 해석하세요.
전문 용어가 나오면 바로 뒤에서 "쉽게 말하면"에 해당하는 생활 언어를 붙이세요. 해설은 명리 근거, 쉬운 뜻, 두 근거가 만날 때의 작용, 잘 쓰일 때의 강점과 과할 때의 부담, 실제 장면과 활용법 순서로 전개하세요.
섹션마다 다음 근거를 우선 배정해 같은 수치와 설명이 반복되지 않게 하세요. core는 일간과 일주, 월지의 계절 환경, 중심 성향과 강약, inner-pace는 강약과 도움을 받거나 힘을 쓰는 비중, learning은 배움과 표현에 관련된 성향과 일주 강점, hidden-strength는 1순위와 2순위 성향의 상호작용, relationships는 또래 관계 성향과 합충 또는 관계 근거, adult-relationships는 일주와 중심, 보조 성향, 일주가 다른 기둥과 맺는 합충, challenge는 과한 기운과 빈 기운, 충돌 근거, wellbeing은 가장 강하고 약한 오행과 강약, career는 중심 성향과 월지 구조, 보완 요소, money는 현실 감각 성향과 자원 운용 근거, parenting은 강약과 보완 요소, life-flow는 타고난 균형과 시기별 점수, 들어오는 기운을 사용하세요.
각 섹션의 마지막에는 앞의 근거를 압축한 한 문장 결론 또는 선택 시사점을 두되, 앞 문장을 그대로 반복하지 마세요.
근거를 나열한 뒤 끝내지 말고, 왜 그 구성이 해당 행동 가능성으로 이어지는지 설명하세요. 이어서 가정, 학교, 놀이, 관계, 성인 생활 중 연령에 맞는 구체적인 장면, 확인할 신호, 부모가 지금 시도할 행동이나 질문을 포함하세요.
기억에 남는 물상 비유는 본문에서 섹션당 한 번까지 사용할 수 있지만, 바로 다음 문장에서 그것이 실제 성향과 선택 방식으로 무엇을 뜻하는지 번역하세요. 비유 자체를 결론으로 사용하지 마세요.
같은 양육 조언과 같은 근거를 여러 섹션에서 반복하지 말고, 미사여구, 막연한 칭찬, 성공을 보장하는 문장으로 길이를 채우지 마세요.
일주와 오행처럼 독자에게 유용한 명리 근거는 쉬운 뜻을 바로 붙여 사용할 수 있습니다. 다만 SI, 기도, raw score, 내부 규칙 id처럼 서비스 내부 계산어나 설명하지 않은 전문 용어는 노출하지 마세요.
"프로필에서는", "자료에서는", "입력값에 따르면", "계산 결과에서는", "AI가 분석한", "보고서에서는", "해설에서는"처럼 제작 과정이나 정보 출처가 말하는 표현을 쓰지 마세요. 서비스가 부모에게 직접 설명하는 완성된 문장만 쓰세요.
career와 money는 성인이 된 뒤의 가능성을 설명하므로 계속 어린아이처럼 묘사하지 말고, 유년기의 관찰 신호와 성인기의 활용 가능성을 구분하세요.
adult-relationships는 성인이 된 뒤 원하는 친밀감, 갈등과 경계의 조율, 마음을 표현하는 방법을 설명하세요. 배우자의 외모, 직업, 신분, 성별 역할, 만남이나 결혼 시기를 예언하지 마세요.
wellbeing은 오행의 강약을 활동, 휴식, 수면, 감정 회복 같은 생활 리듬으로만 번역하세요. 특정 장기, 질환, 체질의 취약성을 연결하지 말고, 사주가 의료 판단을 대신하지 않는다는 문장을 반드시 포함하세요.
life-flow는 각 연령대를 정확히 구분하세요. 19세 이후에는 "아이", "아기", "양육", "훈육", "부모가 관리"라는 표현을 쓰지 말고 "성인이 된 자녀", "성인", "중년의 자녀"처럼 시기에 맞는 주어를 사용하세요.
운명, 질병, 사고, 죽음, 재산 규모, 특정 직업이나 결혼 시점을 단정하거나 예언하지 말고 가능성의 언어를 사용하세요. 성별만으로 배우자상이나 역할을 정하거나, 검증되지 않은 출생 시각을 추정하지 마세요.
`.trim();

export const DAEWOON_INSTRUCTIONS = `
당신은 선택한 출산일에 태어날 사람의 장기 흐름을 연령에 맞게 설명하는 한국어 택일 서비스입니다.
선택된 시기와 해당 연도들의 계산 결과만 근거로 sections 항목을 정확히 1개 작성하세요.
id는 selected-daewoon, icon은 route로 고정하고, 제목은 선택 연령대의 성장 흐름을 구체적으로 표현하세요.
본문은 정확히 2문단, 5~8문장, 240~650자로 작성하세요.
첫 문단에는 타고난 기본 균형과 선택 시기의 점수 변화, 선택한 10년의 간지와 천간, 지지 성향의 쉬운 뜻, 주요 주제, 들어오는 기운이 욕구와 선택 방식에 미칠 가능성을 인과관계가 보이게 설명하세요. 둘째 문단에는 포함된 연도 흐름 가운데 실제로 확인되는 변화와 그 연령대의 생활 장면, 확인할 신호, 본인 또는 가족이 활용할 방법을 담으세요.
명리 용어를 사용할 때는 바로 쉬운 뜻을 붙이고, 타고난 바탕, 새로 들어오는 힘, 둘의 상호작용, 잘 쓰일 때와 부담될 때, 활용할 타이밍이 이어지게 쓰세요.
selectedPeriod.lifeStage의 주체와 관계를 반드시 따르세요. 19세 이후에는 "아이", "아기", "양육", "훈육", "부모가 관찰", 학교나 놀이 중심 표현을 쓰지 말고, 독립, 일, 관계, 자산, 건강한 생활 리듬 등 성인기의 과제로 설명하세요.
일주, 오행, 10년 흐름처럼 독자에게 도움이 되는 근거는 쉬운 뜻을 함께 붙여 사용할 수 있습니다. SI, 기도, raw score, 내부 규칙 id처럼 서비스 내부 계산어나 설명하지 않은 전문 용어는 노출하지 마세요.
"프로필에서는", "자료에서는", "입력값에 따르면", "계산 결과에서는", "AI가 분석한", "보고서에서는", "해설에서는"처럼 제작 과정을 드러내지 마세요.
같은 뜻을 반복하거나 과장된 수식어로 분량을 채우지 말고, 선택된 시기의 데이터마다 서로 다른 의미를 부여하세요.
운명, 질병, 사고, 죽음, 재산 규모, 취업이나 결혼 시점을 단정하거나 예언하지 말고 가능성의 언어를 사용하세요.
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
  const itemCount = task === "daewoon_child_fortune" ? 1 : 12;
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
          max_output_tokens: task === "daewoon_child_fortune" ? 3_000 : 16_000,
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
