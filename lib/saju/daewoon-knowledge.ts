import type { LuckyDay } from "@/lib/lucky-day-types";
import { getExplanationRules, type ExplanationRule } from "@/lib/saju/explanation-knowledge";

type ElementKey = "tree" | "fire" | "earth" | "metal" | "water";
type YongshinType = "BIGEOB" | "SIKSANG" | "JAESUNG" | "GWANSEONG" | "INSEONG";
type YongshinStatus = "STRENGTH" | "WEAKNESS";
type PeriodGroup = "PERIOD_10S" | "PERIOD_2030" | "PERIOD_3050" | "PERIOD_60S";
type GradeCode = "GREAT_PROSPERITY" | "OPEN_FORTUNE" | "CONSERVATION" | "CAUTION";

export interface DaewoonInterpretation {
  index: number;
  ganzi: string;
  ageRange: [number, number];
  periodCode: string;
  periodLabel: string;
  primaryTheme: string;
  keyRoles: string[];
  score: number;
  deltaScore: number;
  gradeCode: GradeCode;
  gradeTitle: string;
  gradeSummary: string;
  yongshinType: YongshinType;
  yongshinStatus: YongshinStatus;
  yongshinFlowScore: number;
  yongshinTitle: string;
  yongshinText: string;
  relationshipText: string | null;
  sinsal: string;
  sinsalTitle: string | null;
  sinsalText: string | null;
}

const PERIODS = [
  { decade: 10, code: "PERIOD_10", label: "10대", group: "PERIOD_10S", theme: "학업 성취와 정서적 성장", roles: ["인성", "관성"] },
  { decade: 20, code: "PERIOD_20", label: "20대", group: "PERIOD_2030", theme: "전공·취업·독립과 관계 형성", roles: ["관성", "식상", "배우자성"] },
  { decade: 30, code: "PERIOD_30", label: "30대", group: "PERIOD_2030", theme: "커리어 안착·결혼·초기 자산 형성", roles: ["재성", "관성"] },
  { decade: 40, code: "PERIOD_40", label: "40대", group: "PERIOD_3050", theme: "사회적 영향력과 커리어 확장", roles: ["관성", "비겁"] },
  { decade: 50, code: "PERIOD_50", label: "50대", group: "PERIOD_3050", theme: "성과의 축적과 자산 보존", roles: ["재성", "인성"] },
  { decade: 60, code: "PERIOD_60", label: "60대", group: "PERIOD_60S", theme: "제2의 인생 설계와 멘토십", roles: ["식상", "인성"] },
  { decade: 70, code: "PERIOD_70", label: "70대", group: "PERIOD_60S", theme: "생활 리듬·가족·지혜 전수", roles: ["식상", "오행 균형"] },
  { decade: 80, code: "PERIOD_80", label: "80대", group: "PERIOD_60S", theme: "정신적 평온과 삶의 정리", roles: ["인성", "오행 균형"] },
] as const;

const GRADES: Array<{
  code: GradeCode;
  min: number;
  max: number;
  title: string;
  summary: string;
}> = [
  { code: "GREAT_PROSPERITY", min: 20, max: Infinity, title: "전성기", summary: "원국보다 균형 점수가 크게 개선되어 준비해 온 역량을 적극적으로 펼치기 좋은 시기입니다." },
  { code: "OPEN_FORTUNE", min: 0, max: 19.99, title: "상승기", summary: "오행의 균형이 원국보다 안정되는 흐름으로, 무리하지 않는 확장과 성장이 잘 맞습니다." },
  { code: "CONSERVATION", min: -9.99, max: -0.01, title: "관리기", summary: "균형 점수가 소폭 낮아지는 만큼 새로운 확장보다 현재 기반과 생활 리듬을 다지는 편이 좋습니다." },
  { code: "CAUTION", min: -Infinity, max: -10, title: "주의기", summary: "한쪽 기운으로 쏠림이 커질 수 있어 중요한 결정은 충분히 검토하고 회복과 내실을 우선해야 합니다." },
];

const ROLE_META: Record<YongshinType, { label: string; meaning: string }> = {
  BIGEOB: { label: "비겁", meaning: "자립심과 추진력" },
  SIKSANG: { label: "식상", meaning: "표현력과 창의성" },
  JAESUNG: { label: "재성", meaning: "현실 감각과 결과" },
  GWANSEONG: { label: "관성", meaning: "규칙성과 책임감" },
  INSEONG: { label: "인성", meaning: "학습과 수용력" },
};

const YONGSHIN_COPY: Record<YongshinType, Record<YongshinStatus, Record<PeriodGroup, string>>> = {
  BIGEOB: {
    STRENGTH: {
      PERIOD_10S: "자존감과 회복탄력성이 자라며 또래 관계에서도 자기 의견을 건강하게 세우기 좋은 흐름입니다.",
      PERIOD_2030: "독립적인 진로 개척과 취업 준비에 힘이 붙고, 믿을 만한 친구와 동료의 지원을 활용하기 좋습니다.",
      PERIOD_3050: "뜻이 맞는 파트너와 협력하거나 리더로서 지지 기반을 넓히기에 유리합니다.",
      PERIOD_60S: "자립적인 생활 리듬과 오랜 인연의 유대가 노년의 활력을 돕습니다.",
    },
    WEAKNESS: {
      PERIOD_10S: "자신감이 흔들릴 수 있으므로 작은 선택과 도전을 스스로 완수하도록 격려하는 양육이 필요합니다.",
      PERIOD_2030: "지인 의견에 휩쓸리기보다 진로와 관계의 기준을 직접 세우고 중요한 약속은 명확히 하는 편이 좋습니다.",
      PERIOD_3050: "성급한 동업이나 공동 투자를 피하고 역할·지분·책임을 문서로 분명히 해야 합니다.",
      PERIOD_60S: "고립감이 생기지 않도록 가벼운 모임과 유연한 신체 활동을 일상에 꾸준히 두는 것이 좋습니다.",
    },
  },
  SIKSANG: {
    STRENGTH: {
      PERIOD_10S: "배운 것을 말·글·예술로 표현할수록 학습의 재미와 창의성이 함께 자라기 쉬운 흐름입니다.",
      PERIOD_2030: "기획·마케팅·개발·창작처럼 고유한 전문성을 보여주는 진로와 깊이 있는 소통에 힘이 붙습니다.",
      PERIOD_3050: "전문 기술과 아이디어를 프로젝트나 사업의 성과로 확장하기 좋은 시기입니다.",
      PERIOD_60S: "취미·창작·가벼운 탐구 활동이 일상에 활력을 주고 가족과의 교감을 풍요롭게 합니다.",
    },
    WEAKNESS: {
      PERIOD_10S: "표현을 재촉하기보다 마음을 먼저 들어주고 아이가 자기 학습 속도를 찾도록 기다려주는 편이 좋습니다.",
      PERIOD_2030: "면접과 제안은 평소보다 꼼꼼히 준비하고 관계에서는 말하기보다 경청을 한 번 더 챙겨야 합니다.",
      PERIOD_3050: "무리한 독립과 확장보다 현재 전문성의 완성도와 협업 신뢰를 높이는 데 집중하는 편이 안전합니다.",
      PERIOD_60S: "활동량을 조절하고 산책과 규칙적인 휴식으로 몸과 마음의 리듬을 회복하는 것이 좋습니다.",
    },
  },
  JAESUNG: {
    STRENGTH: {
      PERIOD_10S: "수학·과학·과제처럼 목표가 분명한 학습에서 성취를 경험하고 좋은 습관을 만들기 쉽습니다.",
      PERIOD_2030: "금융·기획·자산관리처럼 현실 가치를 다루는 진로에서 역량을 발휘하고 신뢰 기반의 관계를 만들기 좋습니다.",
      PERIOD_3050: "계약·사업·자산의 가치를 판단하는 능력이 살아나 실질적인 결실을 축적하기 좋은 흐름입니다.",
      PERIOD_60S: "연금·임대 등 안정적인 자산 흐름을 차분히 관리하며 생활 기반을 지키기 좋습니다.",
    },
    WEAKNESS: {
      PERIOD_10S: "목표를 작게 나누고 정돈된 환경에서 하나씩 끝내는 경험을 칭찬해 주는 방식이 도움이 됩니다.",
      PERIOD_2030: "첫 사회 진출이나 이직 과정에서 예산을 보수적으로 세우고 관계에서도 상대의 입장을 먼저 살피는 편이 좋습니다.",
      PERIOD_3050: "모험적인 투자와 불확실한 동업을 서두르지 말고 현금 흐름과 계약 위험을 우선 점검해야 합니다.",
      PERIOD_60S: "상속이나 가족 자산 문제는 서두르지 말고 충분한 대화와 전문적 검토를 거쳐 조율하는 것이 좋습니다.",
    },
  },
  GWANSEONG: {
    STRENGTH: {
      PERIOD_10S: "규칙을 지키고 맡은 역할을 완수하는 힘이 자라 학업과 공동 활동에서 신뢰를 얻기 좋습니다.",
      PERIOD_2030: "시험·취업·승진처럼 기준이 분명한 관문에서 준비한 역량을 인정받고 책임 있는 관계를 만들기 쉽습니다.",
      PERIOD_3050: "조직의 책임자나 의사결정자로서 평판과 리더십을 공고히 하기 좋은 흐름입니다.",
      PERIOD_60S: "평생 쌓은 신뢰를 자문·봉사·멘토 역할로 나누며 존중받는 관계를 이어가기 좋습니다.",
    },
    WEAKNESS: {
      PERIOD_10S: "완벽해야 한다는 부담을 낮추고 실수해도 안전하다는 정서적 여유를 제공해야 합니다.",
      PERIOD_2030: "조직과 관계에서 자기 규칙만 앞세우지 말고 상대의 방식과 속도를 존중하는 유연성이 필요합니다.",
      PERIOD_3050: "평판과 계약에 오해가 없도록 절차를 투명하게 지키고 중요한 판단은 기록으로 남겨야 합니다.",
      PERIOD_60S: "지위와 역할을 무리하게 유지하기보다 한 걸음 물러나 휴식과 편안한 취미를 받아들이는 편이 좋습니다.",
    },
  },
  INSEONG: {
    STRENGTH: {
      PERIOD_10S: "독서와 깊이 있는 탐구에 몰입하기 좋고 좋은 교사나 멘토의 가르침을 흡수하는 힘이 커집니다.",
      PERIOD_2030: "학위·자격·시험·계약처럼 문서로 남는 전문 기반을 확보하는 데 유리한 흐름입니다.",
      PERIOD_3050: "지식·특허·라이선스를 기반으로 입지를 굳히고 상사나 선배의 조력을 활용하기 좋습니다.",
      PERIOD_60S: "강연·저술·멘토링을 통해 삶의 경험과 지혜를 다음 세대에 전하기 좋은 시기입니다.",
    },
    WEAKNESS: {
      PERIOD_10S: "생각이 복잡해질 수 있으므로 학습 환경을 단순하게 하고 성과보다 정서적 안정부터 챙겨야 합니다.",
      PERIOD_2030: "자격시험은 긴 호흡으로 준비하고 취업·주거 계약의 세부 조항을 여러 번 검토하는 것이 좋습니다.",
      PERIOD_3050: "구두 약속보다 문서와 기록을 우선하고 혼자 판단하기 어려운 계약은 전문가 검토를 받는 편이 안전합니다.",
      PERIOD_60S: "과거와 미래에 대한 생각을 잠시 내려놓고 야외 활동·명상·사람과의 교류로 마음을 환기하는 것이 좋습니다.",
    },
  },
};

const ELEMENT_GENERATES: Record<ElementKey, ElementKey> = {
  tree: "fire", fire: "earth", earth: "metal", metal: "water", water: "tree",
};

const ELEMENT_CONTROLS: Record<ElementKey, ElementKey> = {
  tree: "earth", earth: "water", water: "fire", fire: "metal", metal: "tree",
};

const STEM_ELEMENT: Record<string, ElementKey> = {
  甲: "tree", 乙: "tree", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};

const BRANCH_ELEMENT: Record<string, ElementKey> = {
  子: "water", 丑: "earth", 寅: "tree", 卯: "tree", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

const ROLE_TO_TYPE: Record<string, YongshinType> = {
  bigeop: "BIGEOB", siksang: "SIKSANG", jaeseong: "JAESUNG",
  gwanseong: "GWANSEONG", insung: "INSEONG",
};

const SINSAL_ALIASES: Record<string, string> = {
  劫殺: "겁살", 災殺: "재살", 天殺: "천살", 地殺: "지살", 年殺: "연살", 月殺: "월살",
  亡身: "망신", 將星: "장성", 攀鞍: "반안", 驛馬: "역마", 六害: "육해", 華蓋: "화개",
};

const SINSAL_SAFE_COPY: Record<string, string> = {
  겁살: "경쟁과 역할 조정이 많아질 수 있으므로 사람과 자원의 경계를 분명히 하고 자기 페이스를 지키는 것이 좋습니다.",
  재살: "환경의 제약을 답답하게 느낄 수 있는 흐름입니다. 무리한 돌파보다 규칙과 기본기를 지키며 다음 기회를 준비하는 편이 좋습니다.",
  천살: "예상 밖의 변화가 방향 전환의 계기가 될 수 있습니다. 결과를 미리 단정하지 말고 선택지를 넓혀 유연하게 대응하세요.",
  지살: "이사·전학·파견·여행처럼 환경 변화와 이동 경험을 성장의 자원으로 활용하기 좋은 흐름입니다.",
  연살: "표현력과 대외적 관심이 커질 수 있습니다. 창작과 관계의 장점은 살리되 소비와 타인의 평가에 지나치게 흔들리지 않는 것이 중요합니다.",
  월살: "속도를 내기보다 독서·성찰·기초 학습으로 내면을 다지는 편이 잘 맞는 흐름입니다.",
  망신: "발표나 공개적인 역할처럼 자신을 드러낼 일이 늘 수 있으므로 준비·기록·개인정보 관리를 평소보다 꼼꼼히 하세요.",
  장성: "주도권과 책임이 커지는 흐름입니다. 성과를 독점하기보다 협력자와 권한과 보상을 나눌 때 리더십이 오래갑니다.",
  반안: "기존 노력이 안정적인 결과로 이어지기 쉬운 흐름입니다. 기반을 정돈하고 검증된 계획을 차분히 완성하는 데 집중하세요.",
  역마: "이동과 활동 반경이 넓어질 수 있습니다. 새로운 경험은 적극 활용하되 일정과 휴식의 균형을 함께 관리해야 합니다.",
  육해: "마음이 급해질수록 결정을 잠시 보류하고 충분히 확인하는 습관이 필요합니다. 편안한 생활 환경과 회복 시간을 우선하세요.",
  화개: "혼자 깊이 탐구하고 경험을 정리하는 힘이 커지는 흐름입니다. 연구·창작·기록처럼 축적된 지혜를 결과물로 연결해 보세요.",
};

function getElementRole(base: ElementKey, incoming: ElementKey) {
  if (base === incoming) return "bigeop";
  if (ELEMENT_GENERATES[incoming] === base) return "insung";
  if (ELEMENT_GENERATES[base] === incoming) return "siksang";
  if (ELEMENT_CONTROLS[base] === incoming) return "jaeseong";
  return "gwanseong";
}

function getYongshinFlowScore(yongshin: ElementKey, ganzi: string) {
  const stemRole = getElementRole(yongshin, STEM_ELEMENT[ganzi[0]]);
  const branchRole = getElementRole(yongshin, BRANCH_ELEMENT[ganzi[1]]);
  const stemScore = { insung: 1, bigeop: 2, siksang: -0.5, jaeseong: -1, gwanseong: -2 }[stemRole];
  const branchScore = { insung: 1.3, bigeop: 2.5, siksang: -0.8, jaeseong: -1.3, gwanseong: -2.5 }[branchRole];
  return Math.round((stemScore + branchScore) * 10) / 10;
}

function inferYongshinType(day: LuckyDay): YongshinType {
  const direct = ROLE_TO_TYPE[day.yongshin.role];
  if (direct) return direct;
  return ROLE_TO_TYPE[getElementRole(day.strength.dayMasterElement, day.yongshin.element)];
}

function getPeriod(age: number, index: number) {
  // 대운은 사람마다 시작 나이가 다르므로 해당 대운 구간의 중간 나이를 기준으로
  // 10대~80대 해설 그룹을 고른다. 시작 나이만 반올림하면 첫 두 대운이 같은
  // 그룹으로 잡힐 수 있다(예: 3세, 13세).
  const middleAge = age + 4.5;
  const rounded = Math.max(10, Math.min(80, Math.round(middleAge / 10) * 10));
  return PERIODS.find((period) => period.decade === rounded) ?? PERIODS[Math.min(index, 7)];
}

function getGrade(delta: number) {
  return GRADES.find(({ min, max }) => delta >= min && delta <= max) ?? GRADES[2];
}

function getSinsalRule(sinsal: string) {
  const normalized = SINSAL_ALIASES[sinsal] ?? sinsal.replace(/살$/, "");
  return (getExplanationRules("Theme4_대운흐름과변화") as ExplanationRule[]).find(
    (rule) => rule.status === "ACTIVE" && rule.trigger.includes(`'${normalized}'`),
  );
}

function getPublicSinsalTitle(sinsal: string) {
  const normalized = SINSAL_ALIASES[sinsal] ?? sinsal.replace(/살$/, "");
  return `${normalized.endsWith("살") ? normalized : `${normalized}살`} 대운`;
}

function getRelationshipText(day: LuckyDay, periodGroup: PeriodGroup, type: YongshinType, status: YongshinStatus) {
  if (periodGroup !== "PERIOD_2030") return null;
  if (day.gender === "M" && type === "JAESUNG") {
    return status === "STRENGTH"
      ? "남명에서 재성은 배우자성으로도 읽으므로, 현실적인 신뢰와 생활 계획을 함께 세우는 관계가 결실로 이어지기 좋습니다."
      : "남명에서 재성은 배우자성으로도 읽으므로, 금전과 생활 방식의 차이를 서두르지 말고 충분히 조율하는 것이 중요합니다.";
  }
  if (day.gender === "F" && type === "GWANSEONG") {
    return status === "STRENGTH"
      ? "여명에서 관성은 배우자성으로도 읽으므로, 책임과 약속을 바탕으로 관계를 안정시키기 좋은 흐름입니다."
      : "여명에서 관성은 배우자성으로도 읽으므로, 상대에게 자기 기준을 강요하기보다 약속의 범위를 함께 조율하는 것이 좋습니다.";
  }
  return null;
}

export function buildDaewoonInterpretations(day: LuckyDay): DaewoonInterpretation[] {
  const yongshinType = inferYongshinType(day);
  const scoreByIndex = new Map(day.scoring.daewoonScores.map((item) => [item.index, item]));

  return day.daewoon.slice(0, 8).map((daewoon, index) => {
    const score = scoreByIndex.get(daewoon.index)?.baseScore ?? day.strength.baseScore;
    const deltaScore = Math.round((score - day.strength.baseScore) * 100) / 100;
    const grade = getGrade(deltaScore);
    const period = getPeriod(daewoon.age, index);
    const flowScore = getYongshinFlowScore(day.yongshin.element, daewoon.ganzi);
    const status: YongshinStatus = flowScore >= 0 ? "STRENGTH" : "WEAKNESS";
    const sinsalRule = getSinsalRule(daewoon.sinsal);
    const nextAge = day.daewoon[index + 1]?.age;
    const endAge = nextAge ? nextAge - 1 : daewoon.age + 9;
    const role = ROLE_META[yongshinType];

    return {
      index: daewoon.index,
      ganzi: daewoon.ganzi,
      ageRange: [daewoon.age, endAge],
      periodCode: period.code,
      periodLabel: period.label,
      primaryTheme: period.theme,
      keyRoles: [...period.roles],
      score,
      deltaScore,
      gradeCode: grade.code,
      gradeTitle: grade.title,
      gradeSummary: grade.summary,
      yongshinType,
      yongshinStatus: status,
      yongshinFlowScore: flowScore,
      yongshinTitle: `${role.label}(${role.meaning}) ${status === "STRENGTH" ? "강화" : "보완"}`,
      yongshinText: YONGSHIN_COPY[yongshinType][status][period.group],
      relationshipText: getRelationshipText(day, period.group, yongshinType, status),
      sinsal: SINSAL_ALIASES[daewoon.sinsal] ?? daewoon.sinsal,
      // Excel 제목의 TR_DW_11 같은 내부 규칙 코드는 사용자 화면에 노출하지 않는다.
      sinsalTitle: sinsalRule ? getPublicSinsalTitle(daewoon.sinsal) : null,
      sinsalText: sinsalRule ? SINSAL_SAFE_COPY[SINSAL_ALIASES[daewoon.sinsal] ?? daewoon.sinsal] ?? null : null,
    };
  });
}
