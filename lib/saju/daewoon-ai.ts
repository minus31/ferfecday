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

export interface DaewoonLifeStage {
  key: "childhood" | "adolescence" | "young-adult" | "adult" | "later-life";
  label: string;
  subject: string;
  supporter: string;
  focus: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const SIPSIN_LIFE_THEME: Record<string, string> = {
  本元: "자기 본연의 힘", 比肩: "자기주도와 협력", 劫財: "경쟁 속 선택과 추진",
  食神: "꾸준한 표현과 생산", 傷官: "새로운 표현과 문제 제기",
  偏財: "폭넓은 현실 감각", 正財: "계획과 자원 관리",
  偏官: "긴장 속 실행과 책임", 正官: "기준과 책임",
  偏印: "관찰과 독특한 학습", 正印: "안정적인 학습과 수용",
};

function getSipsinLifeTheme(sipsin: string) {
  return SIPSIN_LIFE_THEME[sipsin] ?? "새로운 선택 방식";
}

/** 10년 흐름의 실제 연령에 맞는 주체와 생활 과제를 정한다. */
export function getDaewoonLifeStage(ageRange: [number, number]): DaewoonLifeStage {
  const [startAge, endAge] = ageRange;
  if (endAge <= 12) {
    return { key: "childhood", label: "유년기", subject: "아이", supporter: "부모", focus: "놀이, 학습 습관, 정서 안정, 또래 관계" };
  }
  if (endAge <= 18) {
    return { key: "adolescence", label: "청소년기", subject: "청소년기 자녀", supporter: "부모", focus: "학업, 진로 탐색, 자율성, 친구 관계" };
  }
  if (startAge < 30) {
    return { key: "young-adult", label: "성인 초기", subject: "성인이 된 자녀", supporter: "가족", focus: "독립, 전공과 일, 관계, 생활 기반" };
  }
  if (startAge < 60) {
    return { key: "adult", label: "성인 중기", subject: "성인 자녀", supporter: "가족", focus: "커리어, 관계, 자산, 책임과 회복" };
  }
  return { key: "later-life", label: "중년 이후", subject: "중년 이후의 자녀", supporter: "가족", focus: "생활 리듬, 관계, 경험의 환원, 삶의 재정비" };
}

/** 지식 DB의 유년기 표현이 성인기 해설에 섞이지 않도록 연령 주체를 맞춘다. */
export function adaptDaewoonTextToLifeStage(value: string, ageRange: [number, number]) {
  const stage = getDaewoonLifeStage(ageRange);
  if (stage.key === "childhood") return value;

  let adapted = value
    .replace(/아기에게/g, `${stage.subject}에게`)
    .replace(/아기의/g, `${stage.subject}의`)
    .replace(/아기를/g, `${stage.subject}를`)
    .replace(/아기가/g, `${stage.subject}가`)
    .replace(/아기는/g, `${stage.subject}는`)
    .replace(/아이에게/g, `${stage.subject}에게`)
    .replace(/아이의/g, `${stage.subject}의`)
    .replace(/아이를/g, `${stage.subject}를`)
    .replace(/아이가/g, `${stage.subject}가`)
    .replace(/아이는/g, `${stage.subject}는`)
    .replace(/아이와/g, `${stage.subject}와`)
    .replace(/아이도/g, `${stage.subject}도`)
    .replace(/아이/g, stage.subject);

  if (stage.key === "adolescence") return adapted;

  adapted = adapted
    .replace(/부모님이/g, `${stage.supporter}이`)
    .replace(/부모님은/g, `${stage.supporter}은`)
    .replace(/부모님께서/g, `${stage.supporter}이`)
    .replace(/부모님/g, stage.supporter)
    .replace(/부모에게/g, `${stage.supporter}에게`)
    .replace(/부모의/g, `${stage.supporter}의`)
    .replace(/부모를/g, `${stage.supporter}을`)
    .replace(/부모가/g, `${stage.supporter}이`)
    .replace(/부모는/g, `${stage.supporter}은`)
    .replace(/부모와/g, `${stage.supporter}과`)
    .replace(/부모/g, stage.supporter)
    .replace(/양육/g, "지원")
    .replace(/훈육/g, "조언")
    .replace(/어린이집/g, "일상")
    .replace(/놀이터|놀이/g, "활동")
    .replace(/학교/g, "사회생활");
  return adapted;
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
  const lifeStage = getDaewoonLifeStage(period.ageRange);

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
        lifeStage,
        score,
        analysis,
        annualFortunes: period.annualFortunes,
      },
    },
    output: {
      language: "ko",
      audience: `출산일을 검토하는 부모가 미래의 ${lifeStage.label} 흐름을 이해하도록 돕는 쉬운 해설`,
      format: "기존 사주 해설과 같은 JSON sections 배열을 사용하고, id, icon, title, body를 가진 항목을 정확히 1개 반환",
      sections: "id는 selected-daewoon, icon은 route, title은 선택 연령대의 성장 흐름, body는 화면에 표시할 본문으로 작성",
      length: "exactly 2 paragraphs, 5~8 sentences, 240~650 Korean characters",
      focus: `해당 시기의 전반적인 흐름, ${lifeStage.subject}의 욕구와 선택 변화, ${lifeStage.focus}, ${lifeStage.supporter}이 경계를 존중하며 도울 방법`,
      ageLanguage: `주어는 ${lifeStage.subject}, 조력자는 ${lifeStage.supporter}입니다. 연령과 맞지 않는 유년기 표현을 사용하지 말 것`,
      evidence: "선택된 10년 흐름과 포함된 연도별 흐름을 타고난 사주와 비교하되, 입력 데이터에 없는 사건을 만들지 말 것",
      reasoningOrder: "타고난 빈틈 또는 강점, 선택한 10년의 간지와 천간·지지 성향의 쉬운 뜻, 두 힘의 상호작용, 강점과 과사용 위험, 연령에 맞는 활용 순서로 쓸 것",
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
  const stage = getDaewoonLifeStage(period.ageRange);
  const scoreDelta = score ? score.baseScore - day.strength.baseScore : 0;
  const generalFlow = score && score.baseScore >= day.strength.baseScore
    ? "평소의 장점을 비교적 자연스럽게 펼치면서 새로운 경험을 받아들일 여유가 커질 수 있습니다."
    : "새로운 변화에 적응하느라 마음의 속도가 느려질 수 있어 익숙한 생활 리듬과 충분한 회복 시간이 중요합니다.";
  const incomingStemTheme = getSipsinLifeTheme(period.daewoon.stemSipsin);
  const incomingBranchTheme = getSipsinLifeTheme(period.daewoon.branchSipsin);
  const incomingEvidence = `이때 들어오는 ${period.daewoon.ganziHangul}(${period.daewoon.ganzi}) 흐름은 겉으로 드러나는 ${incomingStemTheme}과 생활 바탕의 ${incomingBranchTheme}을 함께 보태므로, 두 힘을 어느 선택에 쓰는지가 시기의 방향을 가릅니다.`;
  const firstAnnual = period.annualFortunes[0];
  const lastAnnual = period.annualFortunes.at(-1);
  const annualEvidence = firstAnnual && lastAnnual
    ? `같은 구간 안에서도 초반 ${firstAnnual.year}년의 주요 주제는 ${getSipsinLifeTheme(firstAnnual.stemSipsin)}, 후반 ${lastAnnual.year}년은 ${getSipsinLifeTheme(lastAnnual.branchSipsin)}으로 달라져 관심과 선택의 초점이 조금씩 이동할 수 있습니다.`
    : null;

  const firstParagraph = [
    analysis
      ? `${period.ageRange[0]}~${period.ageRange[1]}세 ${stage.label}에는 ${analysis.primaryTheme.replaceAll("·", ", ")}이 중요한 삶의 주제가 될 수 있습니다.`
      : `${period.ageRange[0]}~${period.ageRange[1]}세 ${stage.label}에는 지금까지 쌓은 경험을 자기 방식으로 정리하고 생활의 중심을 다시 잡는 과정이 중요합니다.`,
    score
      ? `이 시기의 균형 점수는 ${score.baseScore.toFixed(1)}점으로 타고난 기본 균형보다 ${Math.abs(scoreDelta).toFixed(1)}점 ${scoreDelta >= 0 ? "높아, 장점을 펼칠 여유가 커지는 쪽" : "낮아, 확장보다 내실과 회복이 필요한 쪽"}으로 읽힙니다.`
      : generalFlow,
    incomingEvidence,
    analysis ? adaptDaewoonTextToLifeStage(sanitizeFriendlySajuText(analysis.gradeSummary), period.ageRange) : generalFlow,
    analysis
      ? adaptDaewoonTextToLifeStage(sanitizeFriendlySajuText(analysis.yongshinText), period.ageRange)
      : `${stage.subject}가 관계와 활동의 폭을 자신의 체력과 관심에 맞추면 편안한 자신감을 이어가는 데 도움이 됩니다.`,
  ].join(" ");
  const stageGuidance: Record<DaewoonLifeStage["key"], string[]> = {
    childhood: [
      "집과 학교에서는 새로운 활동을 시작하는 속도, 도움을 요청하는 시점, 어려움 뒤에 다시 시도하는 방식을 관찰해 주세요.",
      "부모는 결과를 앞당기기보다 아이가 무엇을 원했고 어떤 도움이 필요한지 묻고, 선택권과 충분한 휴식을 함께 제공하는 것이 좋습니다.",
    ],
    adolescence: [
      "학업과 친구 관계에서는 스스로 정한 목표를 얼마나 이어가는지, 부담이 커질 때 말수가 줄거나 계획을 자주 바꾸는지 살펴봐 주세요.",
      "부모는 결정을 대신하기보다 선택의 이유와 필요한 지원을 묻고, 실패해도 다시 조정할 수 있는 안전한 여지를 남겨주는 편이 좋습니다.",
    ],
    "young-adult": [
      "전공, 취업, 독립, 관계에서는 성인이 된 자녀가 어떤 선택에 오래 집중하고 어려움 뒤 어떻게 생활 리듬을 회복하는지가 중요한 신호입니다.",
      "가족은 결정을 대신하거나 성과를 점검하기보다 요청받은 정보와 정서적 지지를 제공하고, 선택의 책임과 경계를 존중하는 편이 좋습니다.",
    ],
    adult: [
      "커리어, 관계, 자산을 운용하는 과정에서는 성인 자녀가 확장 뒤에도 생활 리듬을 유지하는지, 부담이 커질 때 우선순위를 조정하는지를 살펴볼 수 있습니다.",
      "이 나이는 가족이 관리할 시기가 아니므로 당사자의 판단을 중심에 두고, 조언을 요청받았을 때 경험과 선택지를 나누는 정도가 자연스럽습니다.",
    ],
    "later-life": [
      "중년 이후에는 성취를 더 늘리는 일만큼 생활 리듬, 관계의 밀도, 쌓아온 경험을 어디에 나눌지가 흐름을 활용하는 중요한 기준이 됩니다.",
      "가족은 독립된 삶의 방식을 존중하면서 건강한 일상과 관계를 함께 지킬 수 있는 현실적인 도움을 필요한 만큼 나누는 편이 좋습니다.",
    ],
  };
  const secondParagraph = [annualEvidence, ...stageGuidance[stage.key]].filter(Boolean).join(" ");
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

export function parseDaewoonNarrative(payload: unknown, ageRange?: [number, number]): DaewoonNarrative | null {
  const candidate = getNarrativeCandidate(payload);
  if (!candidate) return null;

  const sanitized = sanitizeFriendlySajuText(candidate)
    .replace(/^```(?:json|markdown|text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  const content = ageRange ? adaptDaewoonTextToLifeStage(sanitized, ageRange) : sanitized;
  const paragraphs = content.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const sentenceCount = (content.match(/[.!?](?:\s|$)/g) ?? []).length;

  if (content.length < 240 || content.length > 650) return null;
  if (paragraphs.length !== 2) return null;
  if (sentenceCount < 5 || sentenceCount > 8) return null;
  if (/프로필에서는|자료에서는|입력(?:값)?에 따르면|계산 결과에서는|AI(?:가|는|의)|보고서에서는|해설에서는|제공된 JSON/i.test(content)) return null;
  if (ageRange && getDaewoonLifeStage(ageRange).key !== "childhood" && /아이|아기|양육|훈육|어린이집|놀이터/.test(content)) return null;

  return { content, paragraphs };
}
