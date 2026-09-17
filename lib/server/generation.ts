import type { LuckyDay } from "../lucky-day-types";
import { REPORT_VERSION, SECTION_TOPICS, type ReportBundle } from "../product";
import { getDayPillarProfile } from "../saju/day-pillar-profiles";
import {
  buildProductReport,
  validateProductReport,
} from "../saju/product-report";
import { buildDaewoonInterpretations } from "../saju/daewoon-knowledge";
import { SAJU_REPORT_MODEL } from "../saju/report-model";
import { collectStars } from "../saju/stars";

export const PRODUCT_INSTRUCTIONS = `당신은 부모가 앞으로 만나게 될 자녀의 기질과 삶을 그려보도록 돕는 한국어 출산 택일 서비스의 해설가입니다.
한 번의 응답으로 사주 해석 12장과 제공된 모든 대운의 해설을 함께 완성합니다. 전체를 먼저 검토해 각 장과 시기의 초점이 중복되거나 모순되지 않게 하세요.
일주, 월지, 오행, 십성, 합충, 용신 중 주제에 맞는 근거를 두 가지 이상 연결하고 전문 용어 뒤에 쉬운 뜻을 붙이세요. 첫 core는 일주와 태어난 계절, 전체 기질이 만나는 모습을 설명하세요.
퍼센트, 수치 비율, SI, 편차, 계산 점수, 내부 코드, '이 날짜에서는', '이 날짜를 선택하면', '프로필에서는', '입력값'은 제목과 본문 모두 금지합니다. 두드러진, 든든하게 받치는, 적당한, 조용히 작용하는 등으로 설명하세요.
일반 장은 550~1300자, learning과 career는 900~1700자, 대운 각각 550~1100자, 모두 3~4문단입니다. 미사여구나 반복 대신 근거, 상호작용, 구체적인 생활 장면, 강점의 과사용과 보완을 담으세요.
learning은 이해, 기억, 탐구, 표현, 과목별 적용 장면, 집중 조건, 유년기와 청소년기의 자율성을 자세히 설명합니다. career는 분야 이름뿐 아니라 실제 하는 일, 조직과 독립 활동의 환경, 적성 탐색 프로젝트, 성인기의 전문성 축적을 설명합니다.
adult-relationships는 성인의 연애와 동반자 관계, 친밀감, 경계, 갈등 조율을 설명하되 배우자 외모, 성별 역할, 결혼 여부나 연도를 정하지 마세요. wellbeing은 전통적 상징을 생활 리듬으로 풀고 장기, 질환, 체질을 예측하지 마세요. 실제 건강과 출산 일정에는 의료진의 판단이 우선임을 알리세요.
모든 대운은 천간과 지지 성향이 타고난 장점과 보완점에 무엇을 더하는지 설명하고 해당 연도 흐름과 활용법을 연결합니다. 청소년기와 성인기가 걸친 구간은 앞뒤를 구분하세요. 19세 이후 아기, 아이, 훈육 대신 당사자, 성인이 된 자녀로 쓰고 일, 독립, 관계, 생활 기반을 다루세요.
운명, 성취, 질병, 사고, 재산, 결혼을 확정하거나 부모의 불안과 죄책감을 자극하지 마세요. 제작 과정 설명과 인사는 생략하세요.`;

export function resolveAIProvider(env: Record<string, string | undefined>) {
  const model = env.OPENAI_SAJU_MODEL || SAJU_REPORT_MODEL;
  if (env.OPENAI_API_KEY)
    return {
      apiKey: env.OPENAI_API_KEY,
      model: model.replace(/^openai\//, ""),
      url: "https://api.openai.com/v1/responses",
    };
  const key = env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN;
  return key
    ? {
        apiKey: key,
        model: model.includes("/") ? model : `openai/${model}`,
        url: "https://ai-gateway.vercel.sh/v1/responses",
      }
    : null;
}
export function extractResponseJson(response: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  const text =
    response.output_text ||
    response.output
      ?.flatMap((part) => part.content || [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text || "")
      .join("");
  try {
    return JSON.parse(text || "");
  } catch {
    return null;
  }
}
export function reportSchema(day: LuckyDay) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["sections", "periods"],
    properties: {
      sections: {
        type: "array",
        minItems: 12,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "icon", "title", "body"],
          properties: {
            id: { type: "string", enum: SECTION_TOPICS.map((item) => item[0]) },
            icon: {
              type: "string",
              enum: SECTION_TOPICS.map((item) => item[1]),
            },
            title: { type: "string" },
            body: { type: "string" },
          },
        },
      },
      periods: {
        type: "array",
        minItems: day.daewoon.length,
        maxItems: day.daewoon.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["index", "title", "body"],
          properties: {
            index: { type: "integer" },
            title: { type: "string" },
            body: { type: "string" },
          },
        },
      },
    },
  };
}
export async function generateReport(day: LuckyDay): Promise<ReportBundle> {
  const provider = resolveAIProvider(process.env);
  if (!provider) return buildProductReport(day);
  const p = getDayPillarProfile(day.dayPillar)!;
  const {
    sourceUrl: _url,
    sourcePage: _page,
    sourceReviewedAt: _date,
    ...knowledge
  } = p;
  // 이메일, 사용자 id, 지역 원문 제외. 계산된 사주와 시기 자료만 전달.
  const evidence = {
    dayPillar: day.dayPillar,
    pillars: day.pillars,
    elementQi: day.elementQi,
    strength: day.strength,
    yongshin: day.yongshin,
    relations: day.relations,
    specialSals: day.specialSals,
    detectedStars: collectStars(day),
    knowledge,
    periods: day.daewoon,
    annualFortunes: day.annualFortunes,
    analysis: buildDaewoonInterpretations(day),
    sections: SECTION_TOPICS,
  };
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      signal: AbortSignal.timeout(260_000),
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        instructions: PRODUCT_INSTRUCTIONS,
        input: JSON.stringify(evidence),
        store: false,
        max_output_tokens: 32000,
        text: {
          format: {
            type: "json_schema",
            name: "complete_birth_report",
            strict: true,
            schema: reportSchema(day),
          },
        },
      }),
    });
    if (!response.ok) return buildProductReport(day);
    const generated = extractResponseJson(await response.json());
    return validateProductReport(generated, day)
      ? { ...generated, source: "ai", version: REPORT_VERSION }
      : buildProductReport(day);
  } catch {
    return buildProductReport(day);
  }
}
export function buildImagePrompt(dayPillar: string) {
  const p = getDayPillarProfile(dayPillar);
  if (!p) throw new Error("지원하지 않는 일주입니다.");
  return `Square original Disney-style 3D animated family film illustration, charming fully clothed Korean toddler, gender-neutral styling, warm expressive face, soft cinematic light, crafted storybook environment. No existing Disney characters or logos. An imaginative symbolic portrait, not a prediction of a real child's appearance. Day-pillar motif: ${p.image}. Personality: ${p.strengths.join(", ")}. Translate motif into background, colors and an age-appropriate prop, not animal body parts. Hopeful, uncluttered composition, no text or watermark.`;
}
export async function generateImage(
  dayPillar: string,
): Promise<Uint8Array | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    signal: AbortSignal.timeout(200_000),
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: buildImagePrompt(dayPillar),
      n: 1,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
    }),
  });
  if (!response.ok) return null;
  const result = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  return result.data?.[0]?.b64_json
    ? Buffer.from(result.data[0].b64_json, "base64")
    : null;
}
