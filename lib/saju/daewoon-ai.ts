import type { LuckyAnnualFortune, LuckyDaewoon, LuckyDay } from "@/lib/lucky-day-types";
import { buildDaewoonInterpretations } from "@/lib/saju/daewoon-knowledge";
import { getDayPillarProfile } from "@/lib/saju/day-pillar-profiles";
import { sanitizeFriendlySajuText } from "@/lib/saju/integrated-report";
import { SAJU_REPORT_MODEL } from "@/lib/saju/report-ai";

export interface DaewoonPeriod {
  daewoon: LuckyDaewoon;
  ageRange: [number, number];
  yearRange: [number, number];
  annualFortunes: LuckyAnnualFortune[];
}

export interface DaewoonNarrative {
  content: string;
  paragraphs: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getDaewoonPeriod(day: LuckyDay, index: number): DaewoonPeriod | null {
  const position = day.daewoon.findIndex((item) => item.index === index);
  if (position < 0) return null;

  const daewoon = day.daewoon[position];
  const nextDaewoon = day.daewoon[position + 1];
  const birthYear = Number(day.date.slice(0, 4));
  const endAge = nextDaewoon ? nextDaewoon.age - 1 : daewoon.age + 9;
  const startYear = birthYear + daewoon.age - 1;
  const endYear = nextDaewoon ? birthYear + nextDaewoon.age - 2 : startYear + 9;

  return {
    daewoon,
    ageRange: [daewoon.age, endAge],
    yearRange: [startYear, endYear],
    annualFortunes: day.annualFortunes.filter(
      (item) => item.year >= startYear && item.year <= endYear,
    ),
  };
}

export function buildDaewoonNarrativeRequest(day: LuckyDay, index: number) {
  const period = getDaewoonPeriod(day, index);
  if (!period) return null;

  const analysis = buildDaewoonInterpretations(day).find((item) => item.index === index) ?? null;
  const score = day.scoring.daewoonScores.find((item) => item.index === index) ?? null;

  return {
    model: SAJU_REPORT_MODEL,
    task: "daewoon_child_fortune",
    report: {
      birth: {
        date: day.date,
        gender: day.gender,
        dayPillar: day.dayPillar,
        pillars: day.pillars,
        dayPillarProfile: getDayPillarProfile(day.dayPillar),
      },
      baseline: {
        elementQi: day.elementQi.percentages,
        strength: day.strength,
        yongshin: day.yongshin,
      },
      selectedPeriod: {
        daewoon: period.daewoon,
        ageRange: period.ageRange,
        yearRange: period.yearRange,
        score,
        analysis,
        annualFortunes: period.annualFortunes,
      },
    },
    output: {
      language: "ko",
      audience: "부모가 아이의 성장과 마음 변화를 이해하도록 돕는 쉬운 해설",
      format: "기존 사주 해설과 같은 JSON sections 배열을 사용하고, id, icon, title, body를 가진 항목을 정확히 1개 반환",
      sections: "id는 selected-daewoon, icon은 route, title은 선택 연령대의 성장 흐름, body는 화면에 표시할 본문으로 작성",
      length: "1~2 paragraphs, 3~7 sentences, 180~700 Korean characters",
      focus: "해당 시기의 전반적인 흐름, 아이 내면의 욕구와 감정 변화, 부모가 관찰할 신호와 도울 방법",
      evidence: "선택된 10년 흐름과 포함된 연도별 흐름을 타고난 사주와 비교하되, 입력 데이터에 없는 사건을 만들지 말 것",
      safety: "운명을 확정하거나 사고, 질병, 죽음, 재산 규모를 예언하지 말고 가능성 언어를 사용할 것",
      style: "전문 코드와 설명 없는 명리 용어를 쓰지 않고, 따뜻하고 구체적인 한국어로 작성할 것",
    },
  };
}

export function buildLocalDaewoonNarrative(day: LuckyDay, index: number): DaewoonNarrative | null {
  const period = getDaewoonPeriod(day, index);
  const analysis = buildDaewoonInterpretations(day).find((item) => item.index === index);
  if (!period) return null;

  const score = day.scoring.daewoonScores.find((item) => item.index === index);
  const generalFlow = score && score.baseScore >= day.strength.baseScore
    ? "평소의 장점을 비교적 자연스럽게 펼치면서 새로운 경험을 받아들일 여유가 커질 수 있습니다."
    : "새로운 변화에 적응하느라 마음의 속도가 느려질 수 있어 익숙한 생활 리듬과 충분한 회복 시간이 중요합니다.";

  const firstParagraph = [
    analysis
      ? `${period.ageRange[0]}~${period.ageRange[1]}세에는 ${analysis.primaryTheme.replaceAll("·", ", ")}이 중요한 성장 주제가 될 수 있습니다.`
      : `${period.ageRange[0]}~${period.ageRange[1]}세에는 지금까지 쌓은 경험을 자기 방식으로 정리하고 생활의 중심을 다시 잡는 과정이 중요한 성장 주제가 될 수 있습니다.`,
    analysis ? sanitizeFriendlySajuText(analysis.gradeSummary) : generalFlow,
    analysis ? sanitizeFriendlySajuText(analysis.yongshinText) : "관계와 활동의 폭을 아이의 체력과 관심에 맞추면 편안한 자신감을 이어가는 데 도움이 됩니다.",
  ].join(" ");
  const secondParagraph = [
    "아이의 실제 마음은 생활 환경과 경험에 따라 다르게 나타날 수 있으므로, 새로운 활동을 시작하는 속도와 어려움 뒤에 회복하는 방식을 함께 관찰해 주세요.",
    "부모는 결과를 미리 정하기보다 아이가 무엇을 원했고 어떤 도움이 필요했는지 묻고, 선택권과 충분한 휴식을 함께 제공하는 것이 좋습니다.",
  ].join(" ");
  const content = `${firstParagraph}\n\n${secondParagraph}`;

  return { content, paragraphs: [firstParagraph, secondParagraph] };
}

function getNarrativeCandidate(payload: unknown) {
  if (!isRecord(payload)) return null;
  const nested = isRecord(payload.narrative) ? payload.narrative : null;
  const firstSection = Array.isArray(payload.sections) && isRecord(payload.sections[0])
    ? payload.sections[0]
    : null;
  const candidates = [
    firstSection?.body,
    firstSection?.content,
    payload.content,
    payload.body,
    payload.text,
    payload.output_text,
    typeof payload.narrative === "string" ? payload.narrative : null,
    nested?.content,
    nested?.body,
  ];
  return candidates.find((value): value is string => typeof value === "string") ?? null;
}

export function parseDaewoonNarrative(payload: unknown): DaewoonNarrative | null {
  const candidate = getNarrativeCandidate(payload);
  if (!candidate) return null;

  const content = sanitizeFriendlySajuText(candidate)
    .replace(/^```(?:json|markdown|text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  const paragraphs = content.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const sentenceCount = (content.match(/[.!?](?:\s|$)/g) ?? []).length;

  if (content.length < 180 || content.length > 700) return null;
  if (paragraphs.length < 1 || paragraphs.length > 2) return null;
  if (sentenceCount < 3 || sentenceCount > 7) return null;

  return { content, paragraphs };
}
