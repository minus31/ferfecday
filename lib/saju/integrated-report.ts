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

export type FriendlySectionIcon =
  | "sparkles"
  | "heart"
  | "brain"
  | "message"
  | "users"
  | "shield"
  | "compass"
  | "wallet"
  | "home"
  | "route";

export interface FriendlyReportSection {
  id: string;
  icon: FriendlySectionIcon;
  title: string;
  body: string;
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

const ROLE_CHILD_TRAIT: Record<keyof LuckyDay["strength"]["roleQi"], string> = {
  bigeop: "자기 생각이 분명하고 스스로 해보려는 힘",
  siksang: "호기심을 말과 행동으로 표현하는 창의성",
  jaeseong: "목표를 현실적인 결과로 이어가는 꾸준함",
  gwanseong: "약속과 질서를 소중히 여기는 책임감",
  insung: "배운 것을 깊이 받아들이는 이해력과 공감력",
};

const STRENGTH_CHILD_TONE: Record<LuckyDay["strength"]["grade"], string> = {
  "extremely-strong": "주도성이 매우 강해 자신의 방향을 힘있게 개척하려는 모습이 두드러질 수 있습니다.",
  "slightly-strong": "건강한 자신감을 바탕으로 새로운 일을 주도하면서도 주변과 균형을 맞출 수 있습니다.",
  neutral: "상황에 맞춰 유연하게 반응하며 여러 기질을 비교적 고르게 펼칠 수 있습니다.",
  "slightly-weak": "주변을 세심하게 살피고 충분히 생각한 뒤 움직이는 신중한 아이로 성장할 가능성이 큽니다.",
  "extremely-weak": "환경과 관계를 민감하게 받아들이는 만큼 안정감 속에서 섬세한 장점을 키우기 좋습니다.",
};

const ELEMENT_GROWTH_TONE: Record<keyof typeof ELEMENT_KO, string> = {
  tree: "성장과 계획의 힘",
  fire: "표현력과 따뜻한 활력",
  earth: "안정감과 생활의 중심",
  metal: "판단력과 분명한 기준",
  water: "사고의 깊이와 유연성",
};

type RoleKey = keyof LuckyDay["strength"]["roleQi"];

const ROLE_FRIENDLY_COPY: Record<RoleKey, { title: string; body: string }> = {
  bigeop: {
    title: "‘내가 해볼래요’가 자연스러운 독립형 아이",
    body: "자기 생각과 방식이 분명하고, 직접 선택하고 움직일 때 자신감이 커집니다. 혼자 해내는 힘은 충분하니 협동 과정에서 차례를 기다리고 다른 의견을 받아들이는 경험을 함께 만들어 주세요.",
  },
  siksang: {
    title: "보고 느낀 것을 자기 방식으로 표현하는 아이",
    body: "호기심을 말, 글, 그림, 몸짓처럼 눈에 보이는 결과로 바꾸는 힘이 좋습니다. 정답을 빨리 알려주기보다 ‘어떻게 생각했어?’라고 물어보면 아이만의 창의성이 더 풍성하게 자랍니다.",
  },
  jaeseong: {
    title: "목표를 세우면 차근차근 결과를 만드는 아이",
    body: "해야 할 일과 얻고 싶은 결과를 현실적으로 살피는 감각이 돋보입니다. 작은 목표를 직접 정하고 완료하는 경험을 쌓게 하면 책임감과 생활력이 자연스럽게 강점으로 자리 잡습니다.",
  },
  gwanseong: {
    title: "약속과 기준을 소중히 여기는 책임감 있는 아이",
    body: "규칙을 이해하고 맡은 역할을 잘 해내려는 마음이 큽니다. 잘해야 사랑받는다고 느끼지 않도록 결과뿐 아니라 시도와 과정도 충분히 인정해 주는 것이 중요합니다.",
  },
  insung: {
    title: "깊이 이해하고 오래 기억하는 생각 많은 아이",
    body: "관찰하고 배운 내용을 자기 안에서 충분히 소화한 뒤 움직이는 편입니다. 재촉하기보다 질문하고 기다려 주면 이해력과 공감 능력이 함께 자라 든든한 지혜가 됩니다.",
  },
};

const STRENGTH_FRIENDLY_COPY: Record<LuckyDay["strength"]["grade"], { title: string; body: string }> = {
  "extremely-strong": {
    title: "큰 파도처럼 힘차지만, 방향을 함께 맞춰 주세요",
    body: "자기 의지와 추진력이 매우 선명해 스스로 길을 만들려는 힘이 큽니다. 억누르기보다 선택에 따른 책임을 알려주고, 양보와 협력이 더 큰 성취를 만든다는 경험을 자주 보여 주세요.",
  },
  "slightly-strong": {
    title: "스스로 서면서도 주변과 손잡을 줄 아는 아이",
    body: "자기 생각을 밀고 나갈 힘과 주변 상황을 살피는 여유가 비교적 잘 어우러집니다. 도전할 기회를 충분히 주되, 도움을 요청하고 의견을 나누는 것도 능력임을 알려 주세요.",
  },
  neutral: {
    title: "상황에 맞춰 유연하게 속도를 조절하는 아이",
    body: "한쪽으로 치우치기보다 환경에 따라 앞에 나서거나 한발 물러설 줄 아는 편입니다. 다양한 경험을 제공하면 아이가 자기에게 잘 맞는 역할과 관심사를 자연스럽게 찾아갑니다.",
  },
  "slightly-weak": {
    title: "서두르기보다 살펴보고 움직이는 신중한 아이",
    body: "주변의 분위기와 사람의 마음을 세심하게 읽고 충분히 생각한 뒤 행동하는 편입니다. 작은 선택을 직접 끝내는 경험과 구체적인 칭찬이 쌓이면 조심성이 단단한 자신감으로 바뀝니다.",
  },
  "extremely-weak": {
    title: "섬세한 감각을 지닌 아이, 안전한 울타리가 먼저예요",
    body: "환경의 변화와 관계의 온도를 민감하게 받아들일 수 있습니다. 익숙한 생활 리듬과 안정적인 애착을 먼저 만들어 주면 섬세함이 관찰력과 공감 능력으로 건강하게 자랍니다.",
  },
};

const RELATIONSHIP_COPY: Record<RoleKey, { title: string; body: string }> = {
  bigeop: {
    title: "친구와 나란히 걷되, 내 길도 잃지 않아요",
    body: "또래와 함께할 때 활력이 커지지만 주도권을 두고 경쟁할 수도 있습니다. 이기고 지는 것보다 함께 해낸 결과를 자주 경험하게 하면 건강한 리더십을 배웁니다.",
  },
  siksang: {
    title: "말과 웃음으로 사람 사이의 문을 여는 아이",
    body: "자기 이야기를 나누며 가까워지는 편이라 밝은 분위기를 만드는 재능이 있습니다. 감정이 앞설 때는 말하기 전에 상대의 표정과 마음을 한 번 더 살피는 습관을 알려 주세요.",
  },
  jaeseong: {
    title: "말보다 행동으로 마음을 보여주는 든든한 친구",
    body: "가까운 사람을 실제로 돕고 약속을 지키며 신뢰를 쌓는 편입니다. 관계를 혼자 책임지려 하지 않도록 원하는 것과 어려운 점을 솔직히 말하는 연습도 필요합니다.",
  },
  gwanseong: {
    title: "예의와 약속을 지키며 오래 신뢰받는 아이",
    body: "관계에서도 기준과 책임을 중요하게 여겨 믿음직한 인상을 줍니다. 친구의 다른 방식도 틀린 것이 아니라는 점을 배우면 원칙과 따뜻함을 함께 갖춘 아이로 자랍니다.",
  },
  insung: {
    title: "상대의 마음을 조용히 읽어주는 다정한 친구",
    body: "사람의 말과 표정을 세심하게 받아들이고 마음을 헤아리는 힘이 좋습니다. 다른 사람의 감정까지 모두 짊어지지 않도록 아이 자신의 마음도 먼저 말할 수 있게 도와주세요.",
  },
};

function getRankedRoles(day: LuckyDay) {
  return (Object.keys(day.strength.roleQi) as RoleKey[])
    .sort((a, b) => day.strength.roleQi[b].percentage - day.strength.roleQi[a].percentage);
}

function getShortTitlePhrase(value: string, maxLength = 28) {
  const phrase = value
    .split(/[,.·/]|하며|이며|있으며|하거나|하고/)[0]
    .trim();
  return phrase.length > maxLength ? `${phrase.slice(0, maxLength).trim()}…` : phrase;
}

function getMoneySection(day: LuckyDay): Pick<FriendlyReportSection, "title" | "body"> {
  const practicalSense = day.strength.roleQi.jaeseong.percentage;
  if (practicalSense >= 25) {
    return {
      title: "작은 것도 허투루 쓰지 않는 야무진 현실 감각",
      body: "시간, 물건, 돈처럼 한정된 것을 계획적으로 쓰고 결과를 확인하는 데 관심이 많을 수 있습니다. 저축만 강조하기보다 가치 있는 경험에 기꺼이 쓰는 법도 함께 알려주면 균형 잡힌 판단력이 자랍니다.",
    };
  }
  if (practicalSense <= 10) {
    return {
      title: "경험에 마음이 먼저 가는 아이, 돈 습관은 천천히",
      body: "당장의 재미와 의미 있는 경험에 먼저 끌릴 수 있어 계획과 정리는 후천적으로 익히는 편이 좋습니다. 용돈을 나누어 쓰고 남기는 간단한 습관부터 시작하면 현실 감각이 자연스럽게 따라옵니다.",
    };
  }
  return {
    title: "필요와 즐거움 사이에서 균형을 배우는 아이",
    body: "현실적인 필요를 살피면서도 좋아하는 일에는 기꺼이 시간과 자원을 쓰는 편입니다. 사고 싶은 것과 필요한 것을 구분하는 대화를 자주 나누면 건강한 경제 감각이 자리 잡습니다.",
  };
}

/** 전문 계산 결과를 부모가 바로 이해할 수 있는 10개 생활 주제로 바꾼다. */
export function buildFriendlySajuSections(day: LuckyDay): FriendlyReportSection[] {
  const profile = getDayPillarProfile(day.dayPillar);
  const roles = getRankedRoles(day);
  const primaryRole = roles[0];
  const secondaryRole = roles[1];
  const image = profile?.image ?? "자기만의 빛을 품은 모습";
  const trait = profile?.traits[0] ?? "자신만의 리듬을 지닌";
  const strengths = profile?.strengths.join("·") ?? ROLE_CHILD_TRAIT[primaryRole];
  const cautions = profile?.cautions.join("·") ?? "마음과 행동의 속도를 맞추는 연습";
  const shortTrait = getShortTitlePhrase(trait);
  const shortCaution = getShortTitlePhrase(cautions);
  const careers = profile?.careerThemes.slice(0, 4) ?? [];
  const money = getMoneySection(day);
  const flow = buildDaewoonInterpretations(day);
  const broadeningPeriod = [...flow].sort((a, b) => b.deltaScore - a.deltaScore)[0];
  const earlyFlow = flow.slice(0, 4)
    .map((item) => `${item.periodLabel}에는 ${item.primaryTheme}`)
    .join(", ");

  const sections: FriendlyReportSection[] = [
    {
      id: "core",
      icon: "sparkles",
      title: `${image}, ${shortTrait} 아이`,
      body: `이 아이는 ${image} 같은 모습을 떠올리게 하는 기질을 지녔습니다. 평소에는 ${trait} 같은 성향이 자연스럽게 드러나며, ${strengths} 같은 장점이 성장의 든든한 바탕이 됩니다. 한 가지 모습으로 단정하기보다 새로운 환경과 익숙한 환경에서 어떻게 달라지는지 함께 지켜봐 주세요.`,
    },
    {
      id: "inner-pace",
      icon: "heart",
      title: STRENGTH_FRIENDLY_COPY[day.strength.grade].title,
      body: STRENGTH_FRIENDLY_COPY[day.strength.grade].body,
    },
    {
      id: "learning",
      icon: "brain",
      title: ROLE_FRIENDLY_COPY[primaryRole].title,
      body: ROLE_FRIENDLY_COPY[primaryRole].body,
    },
    {
      id: "hidden-strength",
      icon: "message",
      title: `익숙해질수록 빛나는 또 하나의 힘, ${ROLE_CHILD_TRAIT[secondaryRole]}`,
      body: `${ROLE_FRIENDLY_COPY[secondaryRole].body} 처음부터 모든 장점이 동시에 보이지는 않습니다. 편안하고 안전하다고 느끼는 환경에서 이 두 번째 강점이 더 자연스럽게 나타날 수 있습니다.`,
    },
    {
      id: "relationships",
      icon: "users",
      title: RELATIONSHIP_COPY[primaryRole].title,
      body: RELATIONSHIP_COPY[primaryRole].body,
    },
    {
      id: "challenge",
      icon: "shield",
      title: `잘하고 싶은 마음이 커질 때, ${shortCaution}`,
      body: `아이의 강점이 지나치게 힘을 쓰면 ${cautions} 같은 모습으로 나타날 수 있습니다. 이는 나쁜 성격이나 정해진 문제가 아니라, 아직 마음과 행동의 속도를 맞추는 중이라는 뜻입니다. 실수한 결과를 바로 고쳐주기보다 아이가 원인을 말하고 다음 방법을 고르게 도와주세요.`,
    },
    {
      id: "career",
      icon: "compass",
      title: careers.length ? `${careers.slice(0, 2).join("·")}처럼 재능을 쓰는 무대가 잘 맞아요` : "좋아하는 일을 자기 방식으로 발전시키는 아이",
      body: `아이의 강점은 ${strengths}입니다. ${careers.join("·") || "기획·표현·탐구"} 같은 분야는 이 힘을 활용할 수 있는 예시입니다. 직업을 미리 정하기보다 어떤 활동을 할 때 오래 집중하고 스스로 다시 시도하는지 관찰하는 것이 더 중요합니다.`,
    },
    {
      id: "money",
      icon: "wallet",
      title: money.title,
      body: money.body,
    },
    {
      id: "parenting",
      icon: "home",
      title: `${ELEMENT_GROWTH_TONE[day.yongshin.element]}을 키워주는 집이 좋아요`,
      body: `${YUKA_BY_STRENGTH[day.strength.grade]} ${YUKA_BY_ELEMENT[day.yongshin.element]} 아이를 바꾸려 하기보다 이미 가진 장점이 편안하게 쓰일 수 있는 환경을 만드는 것이 핵심입니다.`,
    },
    {
      id: "life-flow",
      icon: "route",
      title: broadeningPeriod ? `${broadeningPeriod.periodLabel} 무렵, 아이의 가능성이 한층 넓어져요` : "아이의 성장은 시기마다 다른 모습으로 열려요",
      body: `아이의 성장에는 빠르게 뻗어가는 때와 기초를 단단히 다지는 때가 번갈아 찾아옵니다. ${earlyFlow || "어린 시절에는 생활 리듬과 자신감을 차근차근 쌓는 과정이 중요합니다"}. 흐름이 편안할 때는 경험의 폭을 넓혀주고, 부담이 커지는 때에는 결과를 재촉하기보다 생활 리듬과 마음의 안정을 먼저 챙겨 주세요.`,
    },
  ];

  return sections.map((section) => ({
    ...section,
    title: sanitizeFriendlySajuText(section.title),
    body: sanitizeFriendlySajuText(section.body),
  }));
}

/** 화면용 해설에는 계산 코드와 전문가 용어를 남기지 않는다. */
export function sanitizeFriendlySajuText(value: string) {
  return sanitizeSajuExplanation(value)
    .replace(/\bSI\s*(?:지수)?/gi, "타고난 기운의 균형")
    .replace(/조후용신|억부용신|용신|희신/g, "보완에 필요한 힘")
    .replace(/오행\s*기도|기도/g, "기운의 비중")
    .replace(/일주론/g, "타고난 기질")
    .replace(/격국/g, "재능이 쓰이는 방식")
    .replace(/대운/g, "10년 단위 성장 흐름")
    .replace(/십성/g, "다섯 가지 성향")
    .replace(/신강|신약/g, "자기 힘의 강약")
    .replace(/원국/g, "태어난 사주")
    .replace(/생조/g, "도와주는 힘")
    .replace(/극설/g, "밖으로 쓰이는 힘")
    .replace(/\b(?:TR_DW|BASIC|GYEOK|SIPSEONG|JOB|PARENTING)_[A-Z0-9_]+\b/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function formatGanzi(ganzi: string) {
  return `${[...ganzi].map((char) => GANJI_READING[char] ?? char).join("")}(${ganzi})`;
}

/** 결과 카드에서 부모에게 보여주는 3문장 아기 기질 요약. */
export function buildBabySummary(day: LuckyDay) {
  const profile = getDayPillarProfile(day.dayPillar);
  const dominantRole = (Object.keys(day.strength.roleQi) as Array<keyof LuckyDay["strength"]["roleQi"]>)
    .reduce((best, role) => day.strength.roleQi[role].percentage > day.strength.roleQi[best].percentage ? role : best);
  const traits = profile?.traits.slice(0, 2).join("과 ") ?? "자신만의 리듬과 잠재력";
  const element = day.yongshin.element;

  return sanitizeSajuExplanation([
    `부모님께서 맞이할 아기는 ${day.dayPillarHangul}(${day.dayPillar}) 일주의 ${traits} 같은 특징을 바탕으로 자기만의 색깔을 만들어갈 가능성이 큽니다.`,
    `${ROLE_CHILD_TRAIT[dominantRole]}이 특히 돋보이며, ${STRENGTH_CHILD_TONE[day.strength.grade]}`,
    `성장 과정에서 ${ELEMENT_KO[element]}(${({ tree: "木", fire: "火", earth: "土", metal: "金", water: "水" } as const)[element]}) 기운이 상징하는 ${ELEMENT_GROWTH_TONE[element]}을 길러주면 타고난 장점을 더욱 편안하게 펼칠 수 있습니다.`,
  ].join(" "));
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
