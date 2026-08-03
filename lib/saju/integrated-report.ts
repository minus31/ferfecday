import type { LuckyDay } from "@/lib/lucky-day-types";
import { buildDaewoonInterpretations } from "@/lib/saju/daewoon-knowledge";
import {
  matchExplanationKnowledge,
  type ExplanationRuleMatch,
} from "@/lib/saju/explanation-knowledge";
import { getDayPillarProfile } from "@/lib/saju/day-pillar-profiles";

export interface IntegratedReportContent {
  overview: string;
  dayPillar: string;
  structure: string;
  talent: string;
  parenting: string;
  lifeFlow: string;
}

export interface IntegratedReportResult {
  content: IntegratedReportContent;
  knowledge: ReturnType<typeof matchExplanationKnowledge>;
  daewoon: ReturnType<typeof buildDaewoonInterpretations>;
  matchedRuleIds: string[];
}

const SIPSIN_KO: Record<string, string> = {
  本元: "비견", 比肩: "비견", 劫財: "겁재", 食神: "식신", 傷官: "상관",
  偏財: "편재", 正財: "정재", 偏官: "편관", 正官: "정관", 偏印: "편인", 正印: "정인",
};

const ELEMENT_KO = {
  tree: "목", fire: "화", earth: "토", metal: "금", water: "수",
} as const;

const GANJI_READING: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무", 己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사", 午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
  木: "목", 火: "화", 土: "토", 金: "금", 水: "수",
};

const YUKA_BY_STRENGTH: Record<LuckyDay["strength"]["grade"], string> = {
  "extremely-strong": "아이의 강한 주도성을 억누르기보다 선택권과 책임을 함께 주고, 협력하고 양보하는 경험을 자주 만들어 주세요.",
  "slightly-strong": "아이가 스스로 계획하고 끝까지 해보게 돕되, 결과만큼 과정에서 다른 사람의 의견을 듣는 태도를 칭찬해 주세요.",
  neutral: "학습·놀이·관계 경험을 고르게 제공하고, 아이가 좋아하는 분야를 스스로 발견할 수 있도록 관찰해 주세요.",
  "slightly-weak": "작은 선택을 직접 완수하는 경험을 반복해 자신감을 키우고, 예측 가능한 생활 리듬과 충분한 격려를 제공해 주세요.",
  "extremely-weak": "새로운 환경은 천천히 익히게 하고, 성취를 재촉하기보다 안정적인 애착과 작은 성공 경험부터 쌓아 주세요.",
};

const YUKA_BY_ELEMENT: Record<keyof typeof ELEMENT_KO, string> = {
  tree: "자연 활동, 만들기, 단계별 성장 기록처럼 꾸준히 발전하는 경험이 보완에 도움이 됩니다.",
  fire: "말하기, 음악, 신체 활동처럼 따뜻하게 표현하고 즐거움을 나누는 시간을 마련해 주세요.",
  earth: "규칙적인 식사와 수면, 정리 습관, 작은 책임처럼 안정된 일상을 만들어 주세요.",
  metal: "명확하고 일관된 규칙 안에서 분류·정리·도구 활용 능력을 연습하게 해주세요.",
  water: "충분한 휴식과 경청, 독서와 탐구처럼 생각을 차분히 확장하는 시간을 지켜 주세요.",
};

function formatGanzi(ganzi: string) {
  return `${[...ganzi].map((char) => GANJI_READING[char] ?? char).join("")}(${ganzi})`;
}

/** 내부 코드와 작성자 관점 표현을 사용자용 문장으로 정리한다. */
export function sanitizeSajuExplanation(value: string) {
  return value
    .replace(/\bTR_DW_\d+\s*\(([^)]+)\)/g, "$1")
    .replace(/\b(?:TR_DW|BASIC|GYEOK|SIPSEONG|JOB|PARENTING)_[A-Z0-9_]+\b/g, "")
    .replace(/이 사주는/g, "아기의 사주는")
    .replace(/이 사주가/g, "아기의 사주가")
    .replace(/자녀는/g, "아이는")
    .replace(/자녀가/g, "아이가")
    .replace(/자녀를/g, "아이를")
    .replace(/나 자신/g, "아이 자신")
    .replace(/내가/g, "아이가")
    .replace(/나는/g, "아이는")
    .replace(/나를/g, "아이를")
    .replace(/나의/g, "아이의")
    .replace(/내(?=\s)/g, "아이의")
    .replace(/(?<!\()[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水]{1,2}(?!\))/g, (hanja) =>
      `${[...hanja].map((char) => GANJI_READING[char] ?? char).join("")}(${hanja})`,
    )
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanKnowledgeText(value: string) {
  let text = value.replace(/\r\n/g, "\n").trim();
  if (text.startsWith("보내주신") && text.includes("기본 리포트 보완 분기")) {
    text = text.split("기본 리포트 보완 분기").at(-1)?.replace(/^\s*\([^)]*\)\s*/, "") ?? text;
  }
  return sanitizeSajuExplanation(text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function joinRules(rules: ExplanationRuleMatch[], fallback: string) {
  const texts = rules.map((rule) => cleanKnowledgeText(rule.text)).filter(Boolean);
  return texts.length ? texts.join("\n\n") : fallback;
}

function buildDayPillarText(day: LuckyDay) {
  const profile = getDayPillarProfile(day.dayPillar);
  if (!profile) {
    return `부모님께서 맞이할 아기는 ${day.dayPillarHangul}(${day.dayPillar}) 일주의 기질을 지녔습니다. 일주의 기본 성향만으로 단정하지 않고 월령과 주변 글자, 오행의 강약 및 용신을 함께 살펴야 합니다.`;
  }
  return sanitizeSajuExplanation([
    `부모님께서 맞이할 아기는 ${profile.name}의 기질을 바탕으로 성장합니다. ${profile.summary}`,
    `성향과 기질 — ${profile.detail.temperament}`,
    `재능과 진로 — ${profile.detail.talentAndCareer}`,
    `일과 재물 — ${profile.detail.workAndMoney}`,
    `관계 — ${profile.detail.relationships}`,
    `균형 포인트 — ${profile.detail.balance}`,
    "일주론은 전체 사주 중 일주가 보여주는 기본 경향입니다. 실제 표현 방식은 월령, 주변 간지, 오행 기도와 용신에 따라 달라집니다.",
  ].join("\n\n"));
}

export function buildIntegratedSajuReport(day: LuckyDay): IntegratedReportResult {
  const knowledge = matchExplanationKnowledge(day);
  const daewoon = buildDaewoonInterpretations(day);
  const yongshin = `${day.yongshin.method === "johu" ? "조후" : "억부"}용신 ${ELEMENT_KO[day.yongshin.element]}`;
  const monthSipsin = SIPSIN_KO[day.pillars[2].branchSipsin] ?? day.pillars[2].branchSipsin;
  const basicFallback = `부모님께서 맞이할 아기는 ${day.dayPillarHangul}(${day.dayPillar}) 일주의 기질을 지녔습니다. 일간은 ${GANJI_READING[day.pillars[1].stem]}(${day.pillars[1].stem})이고 신강도는 ${day.strength.gradeLabel}(SI ${day.strength.si.toFixed(2)}%)입니다. 오행의 많고 적음만 보지 않고 ${yongshin}이 실제로 작동할 통로와 십성의 균형을 함께 살펴야 합니다.`;
  const gyeokRules = knowledge.theme2.filter((rule) => rule.category === "GYEOKGUK_MASTER");
  const talentRules = knowledge.theme2.filter((rule) => rule.category !== "GYEOKGUK_MASTER");
  const structureFallback = `아이의 월지 중심 십성은 ${monthSipsin}으로, ${monthSipsin}격 관점의 기본 틀을 가집니다. 격국은 아이의 재능이 장차 사회에서 쓰이는 방식을 읽는 기준이며 천간 투출, 성립·파격·구응과 오행의 생극 흐름을 전체적으로 확인해야 합니다.`;
  const talentFallback = `아이에게 가장 두드러진 역할 기도는 ${knowledge.context.primaryRole}이며 현재 판정은 ${knowledge.context.primaryGidoLevel}입니다. 강점은 직업 이름 하나로 고정하기보다 표현·실행·책임·학습 중 어떤 방식으로 성과를 만드는지 중심으로 키워주세요.`;
  const parentingFallback = `양육에서는 아이의 ${day.strength.gradeLabel} 주체성과 ${yongshin}의 보완을 함께 고려합니다. 강한 기운은 쓸 수 있는 활동 무대로 연결하고, 약한 기운은 생활 습관과 안정적인 경험으로 천천히 채워주는 방식이 좋습니다.`;
  const parentingTip = `부모님을 위한 육아 팁 — ${YUKA_BY_STRENGTH[day.strength.grade]} ${YUKA_BY_ELEMENT[day.yongshin.element]}`;
  const lifeFlow = daewoon.map((item) => {
    const delta = item.deltaScore >= 0 ? `+${item.deltaScore.toFixed(2)}` : item.deltaScore.toFixed(2);
    const parts = [
      `${item.periodLabel} · ${item.ageRange[0]}~${item.ageRange[1]}세 · ${formatGanzi(item.ganzi)}`,
      `아이의 대운 균형 점수는 ${item.score.toFixed(2)}점(${delta})으로 ${item.gradeTitle}에 해당합니다. ${item.gradeSummary}`,
      `이 시기 아이에게 중요한 주제는 ${item.primaryTheme}이며 ${item.keyRoles.join("·")}의 움직임을 중점적으로 봅니다.`,
      `${item.yongshinTitle} — ${item.yongshinText}`,
      item.relationshipText,
      item.sinsalText ? `${item.sinsalTitle ?? item.sinsal} — ${cleanKnowledgeText(item.sinsalText)}` : null,
    ].filter(Boolean);
    return sanitizeSajuExplanation(parts.join("\n"));
  }).join("\n\n");
  const matchedRules = [...knowledge.theme1, ...knowledge.theme2, ...knowledge.theme3];

  return {
    content: {
      overview: `${joinRules(knowledge.theme1, basicFallback)}\n\n${parentingTip}`,
      dayPillar: buildDayPillarText(day),
      structure: joinRules(gyeokRules, structureFallback),
      talent: joinRules(talentRules, talentFallback),
      parenting: joinRules(knowledge.theme3, parentingFallback),
      lifeFlow: lifeFlow || "대운 데이터가 없어 원국 중심 해설만 제공합니다.",
    },
    knowledge,
    daewoon,
    matchedRuleIds: matchedRules.map((rule) => rule.id),
  };
}
