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
  | "hand-heart"
  | "shield"
  | "activity"
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

export interface FriendlyReportEvaluation {
  accepted: boolean;
  issues: string[];
}

export interface SelectionReviewItem {
  label: string;
  value: number;
}

export interface SelectionReview {
  balance: string;
  positiveItems: SelectionReviewItem[];
  negativeItems: SelectionReviewItem[];
  temperament: string;
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
  strong: "아이의 주도성을 충분히 살리면서 다른 사람의 의견을 듣고 조율하는 경험도 함께 만들어 주세요.",
  "slightly-strong": "아이가 스스로 계획하고 끝까지 해보게 돕되, 결과만큼 과정에서 다른 사람의 의견을 듣는 태도를 칭찬해 주세요.",
  neutral: "학습·놀이·관계 경험을 고르게 제공하고, 아이가 좋아하는 분야를 스스로 발견할 수 있도록 관찰해 주세요.",
  "slightly-weak": "작은 선택을 직접 완수하는 경험을 반복해 자신감을 키우고, 예측 가능한 생활 리듬과 충분한 격려를 제공해 주세요.",
  weak: "익숙한 환경에서 작은 결정을 직접 완수하게 하며 자신감과 생활 리듬을 차근차근 키워 주세요.",
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

const ROLE_SCENARIO: Record<keyof LuckyDay["strength"]["roleQi"], string> = {
  bigeop: "예를 들어 놀이 방법을 직접 정하거나 어려운 과제도 먼저 혼자 해보겠다고 나설 수 있습니다.",
  siksang: "예를 들어 새 장난감의 쓰임을 바꾸어 놀거나, 오늘 본 일을 이야기와 그림으로 다시 표현할 수 있습니다.",
  jaeseong: "예를 들어 모으고 싶은 물건이 생기면 필요한 횟수나 순서를 세고, 끝낸 결과를 눈으로 확인하려 할 수 있습니다.",
  gwanseong: "예를 들어 역할이 정해진 모둠 활동에서 자기 차례와 약속을 기억하고, 흐트러진 순서를 바로잡으려 할 수 있습니다.",
  insung: "예를 들어 처음 보는 활동에서는 잠시 지켜보다가 원리를 이해한 뒤 정확하게 따라 하거나, 배운 내용을 오래 기억할 수 있습니다.",
};

const ROLE_OBSERVATION: Record<keyof LuckyDay["strength"]["roleQi"], string> = {
  bigeop: "선택권이 있을 때 집중 시간이 길어지는지, 친구와 함께할 때도 자기 방식을 조절하는지 관찰해 보세요.",
  siksang: "설명하거나 만들어 볼 때 이해가 빨라지는지, 떠오른 생각을 끝까지 완성하는 데 어떤 도움이 필요한지 살펴보세요.",
  jaeseong: "목표와 완료 기준이 분명할 때 더 안정되는지, 결과가 늦어질 때도 과정을 이어갈 수 있는지 살펴보세요.",
  gwanseong: "규칙이 분명할 때 편안해지는지, 실수했을 때 필요 이상으로 자신을 탓하지 않는지 함께 살펴보세요.",
  insung: "혼자 생각할 시간을 준 뒤 더 정확하게 말하는지, 알고도 시작을 망설일 때 어떤 격려가 효과적인지 관찰해 보세요.",
};

const STRENGTH_CHILD_TONE: Record<LuckyDay["strength"]["grade"], string> = {
  "extremely-strong": "주도성이 매우 강해 자신의 방향을 힘있게 개척하려는 모습이 두드러질 수 있습니다.",
  strong: "자기 생각과 추진력이 강해 새로운 일을 주도하려는 모습이 자주 나타날 수 있습니다.",
  "slightly-strong": "건강한 자신감을 바탕으로 새로운 일을 주도하면서도 주변과 균형을 맞출 수 있습니다.",
  neutral: "상황에 맞춰 유연하게 반응하며 여러 기질을 비교적 고르게 펼칠 수 있습니다.",
  "slightly-weak": "주변을 세심하게 살피고 충분히 생각한 뒤 움직이는 신중한 아이로 성장할 가능성이 큽니다.",
  weak: "주변의 분위기를 세심하게 살피며 익숙함과 확신이 생긴 뒤 움직이는 경향이 나타날 수 있습니다.",
  "extremely-weak": "환경과 관계를 민감하게 받아들이는 만큼 안정감 속에서 섬세한 장점을 키우기 좋습니다.",
};

const STRENGTH_SCENARIO: Record<LuckyDay["strength"]["grade"], string> = {
  "extremely-strong": "새로운 놀이를 시작하면 규칙과 역할을 먼저 정하려 할 수 있고, 뜻대로 되지 않을 때 목소리나 행동이 커질 수 있습니다.",
  strong: "새로운 놀이에서 먼저 방향을 제안하고 친구들을 이끌 수 있으며, 역할을 나누는 연습을 함께하면 좋습니다.",
  "slightly-strong": "낯선 모둠에서도 먼저 의견을 내면서 친구의 제안을 받아들일 여지가 있어, 주도하는 역할과 돕는 역할을 모두 경험시키기 좋습니다.",
  neutral: "익숙한 활동에서는 앞장서고 처음 보는 환경에서는 잠시 지켜보는 식으로, 상황에 따라 참여 속도가 달라질 수 있습니다.",
  "slightly-weak": "처음 가는 교실이나 처음 만나는 사람 앞에서는 부모의 반응을 확인한 뒤 천천히 참여하지만, 익숙해지면 자기 몫을 꾸준히 해낼 수 있습니다.",
  weak: "낯선 활동에서는 충분히 관찰한 뒤 참여할 수 있으므로, 미리 순서와 기대를 설명하면 자기 속도로 해낼 수 있습니다.",
  "extremely-weak": "갑작스러운 일정 변경이나 큰 소리처럼 예상하지 못한 자극 뒤에는 평소보다 말수가 줄거나 부모 곁에 오래 머물 수 있습니다.",
};

const ELEMENT_GROWTH_TONE: Record<keyof typeof ELEMENT_KO, string> = {
  tree: "성장과 계획의 힘",
  fire: "표현력과 따뜻한 활력",
  earth: "안정감과 생활의 중심",
  metal: "판단력과 분명한 기준",
  water: "사고의 깊이와 유연성",
};

type RoleKey = keyof LuckyDay["strength"]["roleQi"];

const STEM_ELEMENT: Record<string, keyof typeof ELEMENT_KO> = {
  甲: "tree", 乙: "tree", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};

const MONTH_SEASON: Record<string, string> = {
  寅: "봄의 시작", 卯: "봄의 한가운데", 辰: "봄에서 여름으로 넘어가는 때",
  巳: "여름의 시작", 午: "여름의 한가운데", 未: "여름에서 가을로 넘어가는 때",
  申: "가을의 시작", 酉: "가을의 한가운데", 戌: "가을에서 겨울로 넘어가는 때",
  亥: "겨울의 시작", 子: "겨울의 한가운데", 丑: "겨울에서 봄으로 넘어가는 때",
};

const ROLE_DRIVE: Record<RoleKey, string> = {
  bigeop: "자기 방식으로 시작하려는 힘",
  siksang: "생각을 말과 결과물로 꺼내는 힘",
  jaeseong: "목표를 현실적인 결과로 마무리하는 힘",
  gwanseong: "기준과 책임을 지키려는 힘",
  insung: "충분히 이해하고 받아들이는 힘",
};

const ROLE_SHORT_LABEL: Record<RoleKey, string> = {
  bigeop: "자기주도",
  siksang: "표현과 창작",
  jaeseong: "현실 감각",
  gwanseong: "기준과 책임",
  insung: "학습과 수용",
};

const ROLE_MODIFIER: Record<RoleKey, string> = {
  bigeop: "남이 정한 답을 따르기보다 직접 선택하고 밀고 가는 방식",
  siksang: "안에 있는 생각을 말하거나 만들어 눈에 보이게 하는 방식",
  jaeseong: "흥미를 완료 기준과 쓸모 있는 결과에 연결하는 방식",
  gwanseong: "자유로운 시도에 순서와 책임을 더하는 방식",
  insung: "행동 전에 관찰하고 배운 것을 충분히 쌓는 방식",
};

function getRoleInteraction(primaryRole: RoleKey, secondaryRole: RoleKey) {
  return `${ROLE_DRIVE[primaryRole]}이 출발점이 되고 ${ROLE_DRIVE[secondaryRole]}이 뒤를 받치므로, 두 힘은 ${ROLE_MODIFIER[secondaryRole]}으로 함께 나타날 수 있습니다.`;
}

function getRoleInteractionScene(primaryRole: RoleKey, secondaryRole: RoleKey) {
  const scenario = ROLE_SCENARIO[primaryRole]
    .replace(/^예를 들어 /, "")
    .replace(/할 수 있습니다\.$/, "하는 장면에서 확인할 수 있습니다.");
  return `두 성향이 만나면 ${ROLE_DRIVE[primaryRole]}을 ${ROLE_MODIFIER[secondaryRole]}으로 쓰기 쉬워, ${scenario}`;
}

const ROLE_FRIENDLY_COPY: Record<RoleKey, { title: string; body: string }> = {
  bigeop: {
    title: "스스로 선택할 때 힘이 나는 독립적인 아이",
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
    title: "약속과 기준을 중요하게 여기는 책임감 있는 아이",
    body: "규칙을 이해하고 맡은 역할을 잘 해내려는 마음이 큽니다. 잘해야 사랑받는다고 느끼지 않도록 결과뿐 아니라 시도와 과정도 충분히 인정해 주는 것이 중요합니다.",
  },
  insung: {
    title: "충분히 이해한 뒤 움직이는 생각 깊은 아이",
    body: "관찰하고 배운 내용을 자기 안에서 충분히 소화한 뒤 움직이는 편입니다. 재촉하기보다 질문하고 기다려 주면 이해력과 공감 능력이 함께 자라 든든한 지혜가 됩니다.",
  },
};

const STRENGTH_FRIENDLY_COPY: Record<LuckyDay["strength"]["grade"], { title: string; body: string }> = {
  "extremely-strong": {
    title: "자기주장이 강할수록 선택과 책임을 함께 알려주세요",
    body: "자기 의지와 추진력이 매우 선명해 스스로 길을 만들려는 힘이 큽니다. 억누르기보다 선택에 따른 책임을 알려주고, 양보와 협력이 더 큰 성취를 만든다는 경험을 자주 보여 주세요.",
  },
  strong: {
    title: "힘 있는 주도성을 조율하는 경험이 중요해요",
    body: "자기 생각을 실행으로 옮기고 주변을 이끄는 힘이 큽니다. 선택권과 책임을 함께 주고, 다른 의견을 들은 뒤 더 좋은 방법을 찾는 경험을 반복해 주세요.",
  },
  "slightly-strong": {
    title: "주도성과 협동심을 함께 키우기 좋은 아이",
    body: "자기 생각을 밀고 나갈 힘과 주변 상황을 살피는 여유가 비교적 잘 어우러집니다. 도전할 기회를 충분히 주되, 도움을 요청하고 의견을 나누는 것도 능력임을 알려 주세요.",
  },
  neutral: {
    title: "상황에 맞춰 앞장서거나 기다릴 줄 아는 아이",
    body: "한쪽으로 치우치기보다 환경에 따라 앞에 나서거나 한발 물러설 줄 아는 편입니다. 다양한 경험을 제공하면 아이가 자기에게 잘 맞는 역할과 관심사를 자연스럽게 찾아갑니다.",
  },
  "slightly-weak": {
    title: "충분히 살펴본 뒤 움직이는 신중한 아이",
    body: "주변의 분위기와 사람의 마음을 세심하게 읽고 충분히 생각한 뒤 행동하는 편입니다. 작은 선택을 직접 끝내는 경험과 구체적인 칭찬이 쌓이면 조심성이 단단한 자신감으로 바뀝니다.",
  },
  weak: {
    title: "익숙함 속에서 작은 성공을 차근차근 쌓아주세요",
    body: "주변을 세심하게 살핀 뒤 확신이 생겨야 움직이는 편입니다. 예측 가능한 순서와 작은 선택권을 제공하면 조심성이 안정적인 실행력으로 자랍니다.",
  },
  "extremely-weak": {
    title: "변화에 민감한 아이에게는 익숙한 일상이 먼저예요",
    body: "환경의 변화와 관계의 온도를 민감하게 받아들일 수 있습니다. 익숙한 생활 리듬과 안정적인 애착을 먼저 만들어 주면 섬세함이 관찰력과 공감 능력으로 건강하게 자랍니다.",
  },
};

const RELATIONSHIP_COPY: Record<RoleKey, { title: string; body: string }> = {
  bigeop: {
    title: "친구 사이에서 주도권을 잡기 쉬운 아이",
    body: "또래와 함께할 때 활력이 커지지만 주도권을 두고 경쟁할 수도 있습니다. 이기고 지는 것보다 함께 해낸 결과를 자주 경험하게 하면 건강한 리더십을 배웁니다.",
  },
  siksang: {
    title: "말과 놀이로 친구에게 먼저 다가가는 아이",
    body: "자기 이야기를 나누며 가까워지는 편이라 밝은 분위기를 만드는 재능이 있습니다. 감정이 앞설 때는 말하기 전에 상대의 표정과 마음을 한 번 더 살피는 습관을 알려 주세요.",
  },
  jaeseong: {
    title: "말보다 행동과 약속으로 믿음을 주는 아이",
    body: "가까운 사람을 실제로 돕고 약속을 지키며 신뢰를 쌓는 편입니다. 관계를 혼자 책임지려 하지 않도록 원하는 것과 어려운 점을 솔직히 말하는 연습도 필요합니다.",
  },
  gwanseong: {
    title: "예의와 약속을 지켜 친구의 신뢰를 얻는 아이",
    body: "관계에서도 기준과 책임을 중요하게 여겨 믿음직한 인상을 줍니다. 친구의 다른 방식도 틀린 것이 아니라는 점을 배우면 원칙과 따뜻함을 함께 갖춘 아이로 자랍니다.",
  },
  insung: {
    title: "친구의 표정과 마음을 세심하게 살피는 아이",
    body: "사람의 말과 표정을 세심하게 받아들이고 마음을 헤아리는 힘이 좋습니다. 다른 사람의 감정까지 모두 짊어지지 않도록 아이 자신의 마음도 먼저 말할 수 있게 도와주세요.",
  },
};

const ADULT_RELATIONSHIP_COPY: Record<RoleKey, {
  title: string;
  need: string;
  burden: string;
  scene: string;
}> = {
  bigeop: {
    title: "서로의 독립성을 존중할 때 오래 편안한 관계",
    need: "각자의 선택권을 지키면서 중요한 결정은 함께 정하는 관계",
    burden: "합의를 양보로 받아들이거나 주도권을 놓고 맞서는 모습",
    scene: "이사나 큰 지출을 정할 때 각자 원하는 조건을 먼저 적고 공통 기준을 고르는 모습",
  },
  siksang: {
    title: "대화와 함께하는 경험이 친밀감을 키우는 관계",
    need: "생각과 감정을 말로 나누고 함께 새로운 경험을 만드는 관계",
    burden: "상대의 준비를 기다리지 못하거나 감정이 정리되기 전에 말이 앞서는 모습",
    scene: "갈등 뒤 바로 결론을 내기보다 각자 느낀 점을 말하고 다시 대화할 시간을 약속하는 모습",
  },
  jaeseong: {
    title: "말보다 꾸준한 행동과 약속으로 신뢰를 쌓는 관계",
    need: "생활의 책임과 자원을 공정하게 나누며 행동으로 믿음을 확인하는 관계",
    burden: "문제 해결에 집중하다가 상대가 먼저 바라는 공감과 경청을 놓치는 모습",
    scene: "생활비나 집안일을 정할 때 기준을 투명하게 나누고 상황이 바뀌면 다시 조정하는 모습",
  },
  gwanseong: {
    title: "약속과 책임의 기준을 함께 세울 때 단단한 관계",
    need: "서로 기대하는 약속과 경계를 분명히 하고 꾸준히 지키는 관계",
    burden: "옳은 방식을 하나로 정하거나 자신과 상대에게 지나치게 엄격해지는 모습",
    scene: "일과 가족 일정이 겹칠 때 누가 참을지 정하기보다 우선순위와 가능한 선택지를 함께 조율하는 모습",
  },
  insung: {
    title: "마음을 천천히 확인하고 안전하게 나누는 관계",
    need: "서로의 마음을 충분히 듣고 혼자 정리할 시간도 존중하는 관계",
    burden: "속마음을 미루거나 말하지 않아도 알아주길 기대하는 모습",
    scene: "서운한 일이 생겼을 때 상대의 뜻을 추측하기보다 필요한 시간과 바라는 행동을 직접 말하는 모습",
  },
};

const ELEMENT_RHYTHM_COPY: Record<keyof typeof ELEMENT_KO, {
  energy: string;
  recovery: string;
  practice: string;
}> = {
  tree: {
    energy: "새로운 활동을 시작하고 성장 과정을 확인할 때 활력이 붙는 편",
    recovery: "일정을 넓힌 뒤 한 가지씩 마무리하는 시간이 필요합니다",
    practice: "가벼운 야외 활동과 단계가 보이는 일과를 번갈아 배치해 보세요",
  },
  fire: {
    energy: "사람과 감정을 나누고 몸을 움직일 때 생기가 살아나는 편",
    recovery: "자극이 많은 날에는 조용히 열을 식히는 시간이 필요합니다",
    practice: "표현 활동 뒤 화면과 소리를 줄인 차분한 휴식 시간을 마련해 보세요",
  },
  earth: {
    energy: "예측 가능한 일상과 익숙한 순서를 지킬 때 안정되는 편",
    recovery: "오래 버틴 뒤에는 일정과 책임을 덜어내는 시간이 필요합니다",
    practice: "식사, 수면, 준비 시간을 일정하게 두고 한 번에 하나씩 바꿔 보세요",
  },
  metal: {
    energy: "정리된 환경과 분명한 시작, 종료 기준이 있을 때 집중하는 편",
    recovery: "완벽하게 해내려는 긴장을 풀고 미완성을 허용하는 시간이 필요합니다",
    practice: "정리 활동 뒤 결과를 평가하지 않는 자유 시간과 부드러운 움직임을 넣어 보세요",
  },
  water: {
    energy: "혼자 생각하고 관찰하며 자기 속도로 탐색할 때 힘을 모으는 편",
    recovery: "생각이 길어진 뒤 몸을 움직여 생활 감각을 되찾는 시간이 필요합니다",
    practice: "조용한 독서나 휴식과 산책처럼 리듬 있는 움직임을 함께 마련해 보세요",
  },
};

const STRENGTH_RHYTHM_LABEL: Record<LuckyDay["strength"]["grade"], string> = {
  "extremely-strong": "스스로 밀고 가는 힘이 매우 큰 편",
  strong: "스스로 밀고 가는 힘이 큰 편",
  "slightly-strong": "주도하는 힘이 조금 앞서는 편",
  neutral: "주도하는 힘과 도움을 받는 힘이 고른 편",
  "slightly-weak": "주변의 도움을 받아 힘을 모으는 편",
  weak: "익숙한 환경과 충분한 회복에서 힘을 모으는 편",
  "extremely-weak": "환경의 영향에 민감해 안정된 리듬이 특히 중요한 편",
};

function getRankedRoles(day: LuckyDay) {
  return (Object.keys(day.strength.roleQi) as RoleKey[])
    .sort((a, b) => day.strength.roleQi[b].percentage - day.strength.roleQi[a].percentage);
}

function getMoneySection(day: LuckyDay): Pick<FriendlyReportSection, "title" | "body"> {
  const practicalSense = day.strength.roleQi.jaeseong.percentage;
  const evidence = `이 날짜의 사주에서 계획과 결과를 중시하는 힘은 ${practicalSense.toFixed(1)}%로 나타납니다.`;
  if (practicalSense >= 25) {
    return {
      title: "시간과 물건을 계획적으로 쓰려는 아이",
      body: `${evidence} 시간, 물건, 돈처럼 한정된 것을 계획적으로 쓰고 결과를 확인하는 데 관심이 많을 수 있습니다. 예를 들어 용돈의 사용처를 먼저 정하거나 준비물을 빠뜨리지 않으려고 목록을 만들 수 있습니다.\n\n다만 아끼는 것이 언제나 정답이라고 받아들이면 새로운 경험을 주저할 수 있으니, 저축할 몫, 사용할 몫, 나눌 몫을 함께 정해 보세요. 계획을 지켰는지만 평가하지 말고 필요에 따라 계획을 바꾼 이유도 말하게 하면 유연한 현실 감각이 자랍니다. 성인이 된 뒤에는 예산을 세우고 약속을 이행하는 장점으로 이어질 수 있지만, 숫자만큼 경험의 가치도 함께 판단하는 연습이 필요합니다.`,
    };
  }
  if (practicalSense <= 10) {
    return {
      title: "좋아하는 경험에 먼저 마음이 가는 아이",
      body: `${evidence} 당장의 재미와 의미 있는 경험에 먼저 끌릴 수 있어 계획과 정리는 생활 속에서 천천히 익히는 편이 좋습니다. 예를 들어 갖고 싶은 것이 생겼을 때 바로 선택하고, 남은 돈이나 다음 필요는 나중에 생각할 수 있습니다.\n\n이를 낭비벽으로 단정하지 말고 적은 용돈을 ‘오늘 쓸 것’과 ‘나중에 쓸 것’ 두 칸으로 나누는 연습부터 시작해 보세요. 기다린 기간과 선택한 이유를 함께 기록하면 즐거움을 잃지 않으면서도 현실 감각을 키울 수 있습니다. 성인이 된 뒤에는 충동을 억누르는 것보다 고정비와 자유 지출의 한도를 먼저 정하는 방식이 이 성향을 현실적으로 보완합니다.`,
    };
  }
  return {
    title: "필요와 즐거움 사이에서 균형을 배우는 아이",
    body: `${evidence} 현실적인 필요를 살피면서도 좋아하는 일에는 기꺼이 시간과 자원을 쓰는 편입니다. 예를 들어 학용품은 비교해서 고르면서도 마음에 드는 취미 재료에는 망설임 없이 용돈을 쓸 수 있습니다.\n\n무엇을 샀는지보다 왜 골랐는지, 선택 뒤 만족감이 얼마나 오래갔는지를 대화해 보세요. 사고 싶은 것, 지금 필요한 것, 조금 기다려도 되는 것을 나누어 적어보면 아이가 자기 기준을 만들며 건강한 경제 감각을 익힐 수 있습니다. 성인기에는 수입의 크기보다 목적에 맞게 시간과 돈을 배분하는 능력으로 발전할 가능성이 있습니다.`,
  };
}

function getAdultRelationshipSection(
  day: LuckyDay,
  primaryRole: RoleKey,
  secondaryRole: RoleKey,
): Pick<FriendlyReportSection, "title" | "body"> {
  const primary = ADULT_RELATIONSHIP_COPY[primaryRole];
  const secondary = ADULT_RELATIONSHIP_COPY[secondaryRole];
  const dayRelations = day.relations.pairs.filter((pair) => pair.key.split(",").includes("1"));
  const harmonyCount = dayRelations.flatMap((pair) => [...pair.stem, ...pair.branch])
    .filter((relation) => relation.type.includes("合")).length;
  const tensionCount = dayRelations.flatMap((pair) => [...pair.stem, ...pair.branch])
    .filter((relation) => /沖|刑|害|破|怨嗔/.test(relation.type)).length;
  const primaryPercentage = day.strength.roleQi[primaryRole].percentage;
  const secondaryPercentage = day.strength.roleQi[secondaryRole].percentage;

  return {
    title: primary.title,
    body: `성인의 가까운 관계에서는 ${day.dayPillarHangul}(${day.dayPillar}) 일주와 ${ROLE_SHORT_LABEL[primaryRole]} ${primaryPercentage.toFixed(1)}%, ${ROLE_SHORT_LABEL[secondaryRole]} ${secondaryPercentage.toFixed(1)}%의 조합을 봅니다. 중심 성향은 ${primary.need}를 원하고, 보조 성향은 ${secondary.need}를 더합니다. 일주와 다른 기둥에는 힘을 잇는 합 계열 ${harmonyCount}개, 차이를 조율하게 하는 충, 형 계열 ${tensionCount}개가 있으며, 좋고 나쁨의 개수가 아니라 친밀감과 경계를 함께 연습할 단서로 봅니다.\n\n예를 들어 ${primary.scene}에서 이 성향을 확인할 수 있습니다. 중심 힘이 과해지면 ${primary.burden}이 나타나고, 여기에 ${secondary.burden}도 겹칠 수 있습니다. ‘각자가 지키고 싶은 것과 함께 조정할 수 있는 것은 무엇인가’를 묻는 습관이 관계를 오래 유지하는 데 도움이 됩니다. 이는 결혼 여부, 상대의 모습, 만나는 시기를 정하는 예언이 아니라 성인이 된 자녀가 익히면 좋은 관계 기술을 보여주는 참고입니다.`,
  };
}

function getWellbeingSection(day: LuckyDay): Pick<FriendlyReportSection, "title" | "body"> {
  const entries = (Object.entries(day.elementQi.percentages) as Array<
    [keyof typeof ELEMENT_KO, number]
  >).sort((a, b) => b[1] - a[1]);
  const strongest = entries[0];
  const weakest = entries.at(-1) ?? strongest;
  const strongRhythm = ELEMENT_RHYTHM_COPY[strongest[0]];
  const weakRhythm = ELEMENT_RHYTHM_COPY[weakest[0]];

  return {
    title: `${ELEMENT_KO[strongest[0]]} 기운의 활력은 살리고 ${ELEMENT_KO[weakest[0]]} 기운의 회복은 챙겨주세요`,
    body: `다섯 기운 중 가장 큰 힘은 ${ELEMENT_KO[strongest[0]]} ${strongest[1].toFixed(1)}%, 가장 작은 힘은 ${ELEMENT_KO[weakest[0]]} ${weakest[1].toFixed(1)}%로 활동과 회복의 리듬을 다르게 설계할 근거가 됩니다. ${ELEMENT_KO[strongest[0]]} 기운은 ${strongRhythm.energy}이고, ${ELEMENT_KO[weakest[0]]} 기운을 보완하려면 ${weakRhythm.recovery}. 전체 강약은 ${STRENGTH_RHYTHM_LABEL[day.strength.grade]}이므로 잘하는 활동을 이어가는 능력뿐 아니라 멈추고 도움을 받는 속도도 함께 살펴야 합니다.\n\n예를 들어 바쁜 날 뒤 잠드는 시간, 다음 날 활동을 시작하는 속도, 짜증 뒤 회복 시간을 기록하면 어떤 일정이 이 날짜의 리듬에 맞는지 알기 쉽습니다. ${weakRhythm.practice}. 한 번에 식사, 수면, 운동을 모두 바꾸기보다 한 가지 습관을 1~2주 시험하고 전후 반응을 비교해 보세요. 이 내용은 사주로 질병이나 체질을 판정하는 건강 예측이 아니며, 실제 증상이나 발달 우려는 의료 전문가의 판단을 우선해야 합니다.`,
  };
}

/** 전문 계산 결과를 부모가 바로 이해할 수 있는 12개 생활 주제로 바꾼다. */
export function buildFriendlySajuSections(day: LuckyDay): FriendlyReportSection[] {
  const profile = getDayPillarProfile(day.dayPillar);
  const roles = getRankedRoles(day);
  const primaryRole = roles[0];
  const secondaryRole = roles[1];
  const image = profile?.image ?? "자기만의 빛을 품은 모습";
  const trait = profile?.traits[0] ?? "자신만의 리듬을 지닌";
  const strengths = profile?.strengths.join(", ") ?? ROLE_CHILD_TRAIT[primaryRole];
  const cautions = profile?.cautions.join(", ") ?? "마음과 행동의 속도를 맞추는 연습";
  const careers = profile?.careerThemes.slice(0, 4) ?? [];
  const primaryPercentage = day.strength.roleQi[primaryRole].percentage;
  const secondaryPercentage = day.strength.roleQi[secondaryRole].percentage;
  const dayStem = day.dayPillar[0];
  const dayMasterElement = STEM_ELEMENT[dayStem] ?? day.strength.dayMasterElement;
  const monthPillar = day.pillars.find((pillar) => pillar.name === "월주") ?? day.pillars[2];
  const monthSeason = MONTH_SEASON[monthPillar.branch] ?? "태어난 계절";
  const chartAnchor = `사주의 중심인 일간은 ${GANJI_READING[dayStem] ?? dayStem}(${dayStem}), ${ELEMENT_KO[dayMasterElement]} 기운이고 태어난 달의 월지는 ${GANJI_READING[monthPillar.branch] ?? monthPillar.branch}(${monthPillar.branch}), ${monthSeason}에 해당해 두 조건의 관계도 함께 봅니다.`;
  const roleInteraction = getRoleInteraction(primaryRole, secondaryRole);
  const elementEntries = (Object.entries(day.elementQi.percentages) as Array<
    [keyof typeof ELEMENT_KO, number]
  >).sort((a, b) => b[1] - a[1]);
  const strongestElement = elementEntries[0];
  const weakestElement = elementEntries.at(-1) ?? strongestElement;
  const missingElements = day.elementQi.missing.map((element) => ELEMENT_KO[element]);
  const elementEvidence = missingElements.length === 0
    ? `목, 화, 토, 금, 수의 다섯 기운이 모두 있고, ${ELEMENT_KO[strongestElement[0]]} ${strongestElement[1].toFixed(1)}%와 ${ELEMENT_KO[weakestElement[0]]} ${weakestElement[1].toFixed(1)}% 사이의 배치를 함께 봐야 합니다.`
    : `${ELEMENT_KO[strongestElement[0]]} 기운이 ${strongestElement[1].toFixed(1)}%로 가장 크고 ${missingElements.join(", ")} 기운은 비어 있어, 강한 힘을 살리면서 빈 부분을 생활 경험으로 보완하는 구성이 중요합니다.`;
  const roleEvidence = `다섯 성향을 비교하면 ${ROLE_CHILD_TRAIT[primaryRole]}이 ${primaryPercentage.toFixed(1)}%로 가장 두드러지고, ${ROLE_CHILD_TRAIT[secondaryRole]}이 ${secondaryPercentage.toFixed(1)}%로 뒤를 받칩니다.`;
  const coreRoleEvidence = `다섯 성향에서는 ${ROLE_DRIVE[primaryRole]} ${primaryPercentage.toFixed(1)}%, ${ROLE_DRIVE[secondaryRole]} ${secondaryPercentage.toFixed(1)}% 순으로 두드러집니다.`;
  const money = getMoneySection(day);
  const adultRelationship = getAdultRelationshipSection(day, primaryRole, secondaryRole);
  const wellbeing = getWellbeingSection(day);
  const flow = buildDaewoonInterpretations(day);
  const broadeningPeriod = [...flow].sort((a, b) => b.deltaScore - a.deltaScore)[0];
  const earlyFlow = flow.slice(0, 4)
    .map((item) => `${item.periodLabel}에는 ${item.primaryTheme.replaceAll("·", ", ")}`)
    .join(", ");
  const earlyFlowDescription = earlyFlow
    ? `${earlyFlow} 순으로 성장 주제를 살펴봅니다`
    : "어린 시절에는 생활 리듬과 자신감을 차근차근 쌓는 과정이 중요합니다";

  const sections: FriendlyReportSection[] = [
    {
      id: "core",
      icon: "sparkles",
      title: `${day.dayPillarHangul} 일주, ${ROLE_FRIENDLY_COPY[primaryRole].title}`,
      body: `이 날짜를 선택한다면 중심 기질의 출발점은 ${day.dayPillarHangul}(${day.dayPillar}) 일주입니다. ${chartAnchor} 전통적으로는 ‘${image}’에 비유하며, 쉽게 말하면 ‘${trait}’ 같은 반응을 뜻합니다. ${coreRoleEvidence}\n\n${getRoleInteractionScene(primaryRole, secondaryRole)} 이 조합은 ${strengths} 같은 능력으로 이어질 여지가 있지만, 오래 과하게 쓰이면 ${cautions} 같은 부담도 나타날 수 있습니다. ${ROLE_OBSERVATION[primaryRole]} 따라서 여러 장면을 함께 확인해야 이 날짜의 장점과 보완점을 균형 있게 볼 수 있습니다.`,
    },
    {
      id: "inner-pace",
      icon: "heart",
      title: STRENGTH_FRIENDLY_COPY[day.strength.grade].title,
      body: `이 날짜의 사주는 자기 힘을 쓰는 방식이 ‘${day.strength.gradeLabel}’ 범위에 놓여, 밀고 나가는 힘과 주변 도움을 받아들이는 속도의 관계를 중요하게 봅니다. ${STRENGTH_FRIENDLY_COPY[day.strength.grade].body} ${STRENGTH_SCENARIO[day.strength.grade]}\n\n같은 활동을 시켜도 시작하는 속도, 도움을 청하는 시점, 실패 뒤 다시 시도하는 방식에서 내면의 힘이 드러납니다. 일주일 동안 낯선 활동과 익숙한 활동에서 보인 반응을 각각 기록해 보면, 단순히 적극적이거나 소극적이라는 평가보다 아이에게 맞는 참여 조건을 찾을 수 있습니다. 특히 부모가 개입했을 때와 기다렸을 때의 회복 속도를 비교하면 이 날짜의 강약 구성이 실제 생활에서 어떻게 나타나는지 더 정확히 이해할 수 있습니다.`,
    },
    {
      id: "learning",
      icon: "brain",
      title: `${ROLE_CHILD_TRAIT[primaryRole]}은 배움에서 이렇게 보여요`,
      body: `${roleEvidence} 이 가운데 가장 큰 힘이 배움에 쓰이면 ${ROLE_FRIENDLY_COPY[primaryRole].body} ${ROLE_SCENARIO[primaryRole]} 비슷한 구성을 가진 아이들은 설명을 듣는 방식보다 직접 고르고, 말하고, 완성하는 과정 중 어느 하나에서 집중력이 뚜렷하게 높아질 수 있습니다.\n\n${ROLE_OBSERVATION[primaryRole]} 한 번에 여러 방법을 제시하기보다 읽기, 말하기, 만들기 중 두 가지 방식을 번갈아 시도하고 반응을 기록해 보세요. 정답률만 비교하지 말고 시작까지 걸린 시간, 스스로 수정한 횟수, 끝난 뒤 다시 찾는지를 보면 이 날짜에 맞는 학습 조건을 구체적으로 찾을 수 있습니다.`,
    },
    {
      id: "hidden-strength",
      icon: "message",
      title: `익숙해지면 ${ROLE_CHILD_TRAIT[secondaryRole]}도 드러나요`,
      body: `이 날짜에서는 가장 큰 성향이 ${primaryPercentage.toFixed(1)}%이고 두 번째 성향도 ${secondaryPercentage.toFixed(1)}%를 차지해, 한 가지 모습만으로 설명하기 어려운 구성을 이룹니다. ${roleInteraction} ${ROLE_FRIENDLY_COPY[secondaryRole].body} ${ROLE_SCENARIO[secondaryRole]}\n\n${ROLE_OBSERVATION[secondaryRole]} 집, 놀이터, 어린이집처럼 환경을 바꾸어 관찰하면 첫 반응 뒤에 가려졌던 두 번째 재능을 발견하기 쉽습니다. 결국 이 날짜의 숨은 강점은 두 번째 힘의 크기만이 아니라, 중심 성향을 실제 행동으로 바꾸는 방식에 있습니다.`,
    },
    {
      id: "relationships",
      icon: "users",
      title: RELATIONSHIP_COPY[primaryRole].title,
      body: `관계에서는 ${ROLE_CHILD_TRAIT[primaryRole]}이 ${primaryPercentage.toFixed(1)}%로 가장 먼저 작동할 가능성을 살펴봅니다. ${RELATIONSHIP_COPY[primaryRole].body} 예를 들어 친구가 놀이 규칙을 다르게 제안하거나 자기 차례를 기다려야 할 때, 아이가 말로 조율하는지, 양보하는지, 잠시 빠지는지를 살펴보면 관계 방식을 이해하기 쉽습니다.\n\n갈등이 생기면 누가 맞는지부터 정하기보다 ‘너는 무엇을 원했고 친구는 무엇을 원했을까?’를 차례로 말하게 해주세요. 먼저 다가가는 힘, 거절을 받아들이는 힘, 다시 관계를 회복하는 힘을 따로 관찰해 보세요. 사교적이다, 내성적이다 같은 한 단어보다 어느 단계에서 막히는지를 찾을 때 이 날짜가 가진 관계의 장점을 더 편안하게 키울 수 있습니다.`,
    },
    {
      id: "adult-relationships",
      icon: "hand-heart",
      title: adultRelationship.title,
      body: adultRelationship.body,
    },
    {
      id: "challenge",
      icon: "shield",
      title: "강점이 부담으로 바뀔 때 나타나는 신호를 살펴주세요",
      body: `${day.dayPillarHangul}(${day.dayPillar}) 일주의 강점이 오래 긴장한 상태로 쓰일 때 주의해서 볼 모습은 ‘${cautions}’입니다. 여기에 전체 강약이 ‘${day.strength.gradeLabel}’인 힘 조절 방식이 겹치므로, 잘하고 싶은 마음과 감당할 수 있는 에너지 사이의 차이를 살펴야 합니다. 이는 나쁜 성격이나 정해진 문제가 아니며, 평소보다 말이 거칠어지는지, 시작을 미루는지, 혼자 책임지려 하는지 같은 변화로 먼저 드러날 수 있습니다.\n\n문제가 생긴 직후에는 결과를 바로 고쳐주기보다 ‘무엇이 가장 어려웠는지’, ‘다음에는 어떤 도움을 받고 싶은지’를 아이가 고르게 해주세요. 같은 반응이 반복된다면 수면, 일정, 관계 갈등 중 무엇이 먼저 달라졌는지 기록해 보세요. 원인이 드러나면 활동량을 줄일지, 선택권을 늘릴지, 도움을 더 구체적으로 제시할지를 정할 수 있어 막연한 훈육보다 실제적인 대응이 됩니다.`,
    },
    {
      id: "wellbeing",
      icon: "activity",
      title: wellbeing.title,
      body: wellbeing.body,
    },
    {
      id: "career",
      icon: "compass",
      title: careers.length ? `${careers.slice(0, 2).join(", ")} 활동에서 재능을 시험해 보세요` : "여러 활동에서 오래 집중하는 분야를 찾아보세요",
      body: `이 날짜에서는 ${ROLE_CHILD_TRAIT[primaryRole]} ${primaryPercentage.toFixed(1)}%와 ${ROLE_CHILD_TRAIT[secondaryRole]} ${secondaryPercentage.toFixed(1)}%의 조합이 진로 탐색의 핵심 근거가 됩니다. 일주에서 읽는 구체적인 강점은 ${strengths}이며, ${careers.join(", ") || "기획, 표현, 탐구"} 분야는 이 힘을 시험할 활동 예시이지 미래 직업을 미리 정한 예언은 아닙니다. 예를 들어 같은 교육 분야도 설명할 때 즐거운지, 자료를 정리할 때 몰입하는지, 모둠을 이끌 때 힘이 나는지에 따라 적성은 달라집니다.\n\n어릴 때는 직업 이름보다 어떤 과정을 좋아하는지 확인해 주세요. 한 달 단위로 만들기, 설명하기, 기록하기, 팀 활동을 번갈아 제공하고 집중 시간, 재시도, 자발적인 반복을 기록하면 재능의 방향이 선명해집니다. 성인이 된 뒤에는 이 기록에서 꾸준히 반복된 작업 방식이 전공과 직무를 고를 때 더 믿을 만한 단서가 될 수 있습니다.`,
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
      title: `집에서는 ${ELEMENT_GROWTH_TONE[day.yongshin.element]}을 키워주세요`,
      body: `${elementEvidence} 이 배치에서 균형을 돕는 핵심은 ${ELEMENT_KO[day.yongshin.element]} 기운이 상징하는 ${ELEMENT_GROWTH_TONE[day.yongshin.element]}입니다. ${YUKA_BY_STRENGTH[day.strength.grade]} ${YUKA_BY_ELEMENT[day.yongshin.element]} 이것은 부족한 성격을 고친다는 뜻이 아니라, 아이가 긴장하지 않고 장점을 쓸 수 있도록 생활 환경을 조정하는 방법입니다.\n\n한꺼번에 많은 습관을 바꾸기보다 이번 주에는 수면 시간, 선택권, 표현 활동 중 한 가지만 정해 시도해 보세요. 시작 전과 일주일 뒤의 짜증 빈도, 집중 시간, 도움 요청 방식을 비교하면 무엇이 실제로 아이에게 도움이 되었는지 확인할 수 있습니다. 효과가 없으면 아이를 탓하지 말고 활동의 난이도와 부모의 개입 정도를 먼저 조절해 주세요.`,
    },
    {
      id: "life-flow",
      icon: "route",
      title: broadeningPeriod ? `${broadeningPeriod.periodLabel} 무렵에는 경험의 폭을 넓혀주세요` : "성장 시기마다 경험의 속도를 다르게 맞춰주세요",
      body: `이 날짜의 장기 흐름에는 새로운 경험을 넓히기 좋은 때와, 익힌 것을 반복하며 기반을 다지기 좋은 때가 번갈아 나타납니다. 첫 네 시기는 ${earlyFlowDescription}. 가장 넓게 움직여볼 만한 구간은 ${broadeningPeriod ? `${broadeningPeriod.periodLabel}의 ${broadeningPeriod.primaryTheme.replaceAll("·", ", ")}` : "개인의 실제 선택과 환경을 함께 확인한 뒤 정해야 합니다"}. 이는 특정 사건의 예언이 아니라 시기마다 확장과 안정 중 어느 쪽에 무게를 둘지 보는 기준입니다.\n\n유년기에는 부모가 수면, 학습, 관계의 변화를 기록하며 환경을 조정할 수 있습니다. 20대 이후에는 성인이 된 자녀가 전공, 일, 관계의 선택권을 주도하고 가족은 요청받은 지지를 제공하는 편이 자연스럽습니다. 30대, 40대, 50대에는 유년기의 양육 관점이 아니라, 당사자가 커리어, 관계, 생활 기반을 어떻게 운용하는지 중심으로 각 구간을 읽어야 합니다.`,
    },
  ];

  return sections.map((section) => ({
    ...section,
    title: sanitizeFriendlySajuText(section.title),
    body: sanitizeFriendlySajuText(section.body),
  }));
}

const FRIENDLY_FORBIDDEN_TERM_PATTERN = /\bSI\b|기도|용신|희신|일주론|격국|대운|십성|신강|신약|원국|생조|극설|TR_DW|GYEOK|SIPSEONG/i;
const ABSTRACT_SCENERY_TITLE_PATTERN = /(건조한|메마른|습한|차가운|뜨거운).{0,12}(땅|들판|산|물|길)|구불구불한 길|큰 파도처럼/;
const PRACTICAL_DETAIL_PATTERN = /예를 들어|관찰|기록|살펴|해보|해주세요|주세요|경우|비교/;
const GROUNDED_EVIDENCE_PATTERNS = [
  /이 날짜|일주/,
  /\d+(?:\.\d+)?%|\d+(?:\.\d+)?점/,
  /오행|다섯 기운|(?:목|화|토|금|수)(?:\([木火土金水]\))? 기운/,
  /강약|균형|자기 힘|보완/,
  /\d+대|\d+~\d+세|유년기|청소년기|성인기|중년|시기/,
] as const;
const PROVIDER_META_PATTERN = /프로필(?:에서는|에는|상|을 보면)|자료에서는|입력(?:값)?에 따르면|계산 결과에서는|AI(?:가|는|의)|생성된 (?:글|문장|해설)|보고서에서는|해설에서는|제공된 JSON/i;
const ADULT_AS_CHILD_PATTERN = /(?:20|30|40|50|60|70|80)대.{0,24}(?:아이|아기)|(?:아이|아기).{0,24}(?:20|30|40|50|60|70|80)대/;
const UNSAFE_HEALTH_DETAIL_PATTERN = /폐|기관지|대장|신장|방광|심장|혈관|간장|위장|생식기|호르몬|천식|비염|당뇨|고혈압|암\b/;
const UNSAFE_PARTNER_PREDICTION_PATTERN = /아내의 별|남편의 별|배우자(?:의)? (?:외모|직업|신분)|(?:결혼|인연).{0,12}(?:\d{4}년|시기|나이|반드시)/;
const EXPECTED_FRIENDLY_SECTIONS: ReadonlyArray<readonly [string, FriendlySectionIcon]> = [
  ["core", "sparkles"],
  ["inner-pace", "heart"],
  ["learning", "brain"],
  ["hidden-strength", "message"],
  ["relationships", "users"],
  ["adult-relationships", "hand-heart"],
  ["challenge", "shield"],
  ["wellbeing", "activity"],
  ["career", "compass"],
  ["money", "wallet"],
  ["parenting", "home"],
  ["life-flow", "route"],
];

/** 로컬 및 생성형 해설을 같은 독자 관점 기준으로 검사한다. */
export function evaluateFriendlySajuSections(
  sections: FriendlyReportSection[],
  day?: LuckyDay,
): FriendlyReportEvaluation {
  const issues: string[] = [];
  const profileImage = day ? getDayPillarProfile(day.dayPillar)?.image : null;

  if (sections.length !== EXPECTED_FRIENDLY_SECTIONS.length) {
    issues.push(`섹션 수가 ${sections.length}개입니다. 정확히 ${EXPECTED_FRIENDLY_SECTIONS.length}개여야 합니다.`);
  }

  sections.forEach((section, index) => {
    const label = `${index + 1}번 섹션(${section.id})`;
    const sentenceCount = (section.body.match(/[.!?](?:\s|$)/g) ?? []).length;
    const paragraphCount = section.body.split(/\n\s*\n/).filter(Boolean).length;
    const expected = EXPECTED_FRIENDLY_SECTIONS[index];
    if (expected && (section.id !== expected[0] || section.icon !== expected[1])) {
      issues.push(`${label}의 id 또는 icon이 정해진 주제 순서와 다릅니다.`);
    }
    if (section.title.length < 10 || section.title.length > 55) {
      issues.push(`${label} 제목은 10~55자여야 합니다.`);
    }
    if ((profileImage && section.title.includes(profileImage)) || ABSTRACT_SCENERY_TITLE_PATTERN.test(section.title)) {
      issues.push(`${label} 제목이 아이의 행동 특성 대신 자연물 비유를 앞세웁니다.`);
    }
    if (section.body.length < 240 || section.body.length > 650) {
      issues.push(`${label} 본문은 구체적인 정보가 담긴 240~650자여야 합니다.`);
    }
    if (sentenceCount < 5 || sentenceCount > 8) {
      issues.push(`${label} 본문은 근거, 생활 장면, 관찰 또는 대응을 포함한 5~8문장이어야 합니다.`);
    }
    if (paragraphCount !== 2) {
      issues.push(`${label} 본문은 모바일에서 읽기 좋은 2개 문단이어야 합니다.`);
    }
    if (!PRACTICAL_DETAIL_PATTERN.test(section.body)) {
      issues.push(`${label} 본문에 생활 예시, 관찰법, 실행 방법 중 하나가 없습니다.`);
    }
    const evidenceKinds = GROUNDED_EVIDENCE_PATTERNS.filter((pattern) => pattern.test(section.body)).length;
    if (evidenceKinds < 2) {
      issues.push(`${label} 본문에 서로 다른 사주 구성이나 시기 근거가 두 가지 이상 없습니다.`);
    }
    if (PROVIDER_META_PATTERN.test(`${section.title}\n${section.body}`)) {
      issues.push(`${label}에 제작 과정이나 AI가 자신을 설명하는 메타 표현이 남아 있습니다.`);
    }
    if (section.id === "life-flow" && !/성인이 된 자녀|성인 자녀|성인기|중년|당사자/.test(section.body)) {
      issues.push(`${label}에 성인기 주체와 생활 과제가 없습니다.`);
    }
    if (section.id === "life-flow" && ADULT_AS_CHILD_PATTERN.test(section.body)) {
      issues.push(`${label}이 성인기의 주체를 유년기의 아이처럼 묘사합니다.`);
    }
    if (section.id === "adult-relationships" && !/성인|가까운 관계|동반자|친밀/.test(section.body)) {
      issues.push(`${label}에 성인기의 친밀한 관계와 관계 기술 설명이 없습니다.`);
    }
    if (section.id === "adult-relationships" && UNSAFE_PARTNER_PREDICTION_PATTERN.test(section.body)) {
      issues.push(`${label}이 배우자 모습이나 결혼 시점을 예언합니다.`);
    }
    if (section.id === "wellbeing" && !/질병이나 체질을 판정|의료 전문가/.test(section.body)) {
      issues.push(`${label}에 건강 해설의 한계와 의료 판단 우선 원칙이 없습니다.`);
    }
    if (section.id === "wellbeing" && UNSAFE_HEALTH_DETAIL_PATTERN.test(section.body)) {
      issues.push(`${label}이 사주로 장기나 질환의 취약성을 예측합니다.`);
    }
    if (FRIENDLY_FORBIDDEN_TERM_PATTERN.test(`${section.title}\n${section.body}`)) {
      issues.push(`${label}에 일반 독자에게 설명되지 않은 전문 또는 내부 용어가 남아 있습니다.`);
    }
  });

  return { accepted: issues.length === 0, issues };
}

/** 화면용 해설에는 계산 코드와 전문가 용어를 남기지 않는다. */
export function sanitizeFriendlySajuText(value: string) {
  return sanitizeSajuExplanation(value)
    .replace(/·/g, ", ")
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

function getLifeFlowSubject(ageRange: [number, number]) {
  if (ageRange[1] <= 12) return "아이";
  if (ageRange[1] <= 18) return "청소년기 자녀";
  if (ageRange[0] < 30) return "성인이 된 자녀";
  if (ageRange[0] < 60) return "성인 자녀";
  return "중년 이후의 자녀";
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

/** 결과 카드에서 실제 점수 근거와 아이의 기질을 함께 보여주는 택일 총평. */
export function buildSelectionReview(day: LuckyDay): SelectionReview {
  const elementEntries = (Object.entries(day.elementQi.percentages) as Array<
    [keyof typeof ELEMENT_KO, number]
  >).sort((a, b) => b[1] - a[1]);
  const strongest = elementEntries[0];
  const weakest = elementEntries.at(-1) ?? strongest;
  const missingDescription = day.elementQi.missing.length === 0
    ? "다섯 오행이 모두 갖춰져 있습니다"
    : `${day.elementQi.missing.map((element) => ELEMENT_KO[element]).join(", ")} 기운이 비어 있습니다`;
  const scoredDetails = day.scoring.details.filter(
    (detail) => detail.category !== "balance-base" && detail.category !== "reference",
  );
  const toItem = (detail: LuckyDay["scoring"]["details"][number]) => ({
    label: detail.label.replace(/^\d+장\s*/, ""),
    value: detail.value,
  });

  return {
    balance: `아기의 사주는 ${day.strength.gradeLabel}, SI ${day.strength.si.toFixed(4)}입니다. ${missingDescription}. 가장 강한 기운은 ${ELEMENT_KO[strongest[0]]} ${strongest[1].toFixed(1)}%, 가장 약한 기운은 ${ELEMENT_KO[weakest[0]]} ${weakest[1].toFixed(1)}%이며, 오행 편차는 ${day.strength.sigma.toFixed(2)}%입니다. 이를 반영한 대운 평균 기본점수는 ${day.scoring.breakdown.daewoonAverageBaseScore.toFixed(1)}점입니다.`,
    positiveItems: scoredDetails.filter((detail) => detail.value > 0).map(toItem),
    negativeItems: scoredDetails.filter((detail) => detail.value < 0).map(toItem),
    temperament: buildBabySummary(day),
  };
}

/** 내부 코드와 작성자 관점 표현을 사용자용 문장으로 정리한다. */
export function sanitizeSajuExplanation(value: string) {
  return value
    .replace(/\bTR_DW_\d+\s*\(([^)]+)\)/g, "$1")
    .replace(/\b(?:TR_DW|BASIC|GYEOK|SIPSEONG|JOB|PARENTING)_[A-Z0-9_]+\b/g, "")
    .replace(/이 사주는/g, "아기의 사주는")
    .replace(/이 사주가/g, "아기의 사주가")
    .replace(/나 자신/g, "아이 자신")
    .replace(/내가/g, "아이가")
    .replace(/(^|[.!?]\s+|\n)나는(?=\s)/gm, "$1아이는")
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
  const basicFallback = `부모님께서 맞이할 아기는 ${day.dayPillarHangul}(${day.dayPillar}) 일주의 기질을 지녔습니다. 일간은 ${GANJI_READING[day.pillars[1].stem]}(${day.pillars[1].stem})이고 신강도는 ${day.strength.gradeLabel}(SI ${day.strength.si.toFixed(4)})입니다. 오행의 많고 적음만 보지 않고 ${yongshin}이 실제로 작동할 통로와 십성의 균형을 함께 살펴야 합니다.`;
  const gyeokRules = knowledge.theme2.filter((rule) => rule.category === "GYEOKGUK_MASTER");
  const talentRules = knowledge.theme2.filter((rule) => rule.category !== "GYEOKGUK_MASTER");
  const structureFallback = `아이의 월지 중심 십성은 ${monthSipsin}으로, ${monthSipsin}격 관점의 기본 틀을 가집니다. 격국은 아이의 재능이 장차 사회에서 쓰이는 방식을 읽는 기준이며 천간 투출, 성립·파격·구응과 오행의 생극 흐름을 전체적으로 확인해야 합니다.`;
  const talentFallback = `아이에게 가장 두드러진 역할 기도는 ${knowledge.context.primaryRole}이며 현재 판정은 ${knowledge.context.primaryGidoLevel}입니다. 강점은 직업 이름 하나로 고정하기보다 표현·실행·책임·학습 중 어떤 방식으로 성과를 만드는지 중심으로 키워주세요.`;
  const parentingFallback = `양육에서는 아이의 ${day.strength.gradeLabel} 주체성과 ${yongshin}의 보완을 함께 고려합니다. 강한 기운은 쓸 수 있는 활동 무대로 연결하고, 약한 기운은 생활 습관과 안정적인 경험으로 천천히 채워주는 방식이 좋습니다.`;
  const parentingTip = `부모님을 위한 육아 팁 — ${YUKA_BY_STRENGTH[day.strength.grade]} ${YUKA_BY_ELEMENT[day.yongshin.element]}`;
  const lifeFlow = daewoon.map((item) => {
    const delta = item.deltaScore >= 0 ? `+${item.deltaScore.toFixed(2)}` : item.deltaScore.toFixed(2);
    const subject = getLifeFlowSubject(item.ageRange);
    const parts = [
      `${item.periodLabel} · ${item.ageRange[0]}~${item.ageRange[1]}세 · ${formatGanzi(item.ganzi)}`,
      `${subject}의 대운 균형 점수는 ${item.score.toFixed(2)}점(${delta})으로 ${item.gradeTitle}에 해당합니다. ${item.gradeSummary}`,
      `이 시기 ${subject}에게 중요한 주제는 ${item.primaryTheme}이며 ${item.keyRoles.join("·")}의 움직임을 중점적으로 봅니다.`,
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
