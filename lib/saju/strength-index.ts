import type { SajuResult } from "@orrery/core/types";

import {
  ELEMENT_ROLE_LABELS,
  getDayMasterElement,
  getElementRoleQi,
  type ElementQiResult,
  type ElementRole,
  type ElementRoleQi,
} from "@/lib/saju/element-qi";

export type StrengthGrade =
  | "slightly-strong"
  | "neutral"
  | "slightly-weak"
  | "extremely-strong"
  | "extremely-weak";

export interface StrengthIndexResult {
  dayMasterElement: "tree" | "fire" | "earth" | "metal" | "water";
  roleQi: Record<ElementRole, ElementRoleQi>;
  supportQi: number;
  drainControlQi: number;
  si: number;
  grade: StrengthGrade;
  gradeLabel: string;
  k: number;
  baseScore: number;
  targetScoreRange: [number, number];
  description: string;
}

interface StrengthGradeRule {
  grade: StrengthGrade;
  label: string;
  k: number;
  targetScoreRange: [number, number];
  description: string;
  matches: (si: number) => boolean;
}

const OPTIMAL_SI = 17.5;

const STRENGTH_GRADE_RULES: StrengthGradeRule[] = [
  {
    grade: "extremely-strong",
    label: "극신강",
    k: 1.5,
    targetScoreRange: [50, 65],
    description:
      "고집과 아집이 강해 타인과 충돌하기 쉽고, 부모나 배우자의 통제를 벗어나는 외고집 기질.",
    matches: (si) => si > 30,
  },
  {
    grade: "slightly-strong",
    label: "약신강",
    k: 0.18,
    targetScoreRange: [96, 100],
    description:
      "주도성과 강인한 생활력, 뛰어난 재물/명예 취득 능력을 지닌 엘리트형 사주.",
    matches: (si) => si > 5 && si <= 30,
  },
  {
    grade: "neutral",
    label: "중화",
    k: 0.4,
    targetScoreRange: [90, 95],
    description:
      "일평생 큰 굴곡이나 풍파 없이 안정되고 무탈하며 건강하게 살아가는 균형 잡힌 사주.",
    matches: (si) => si >= -5 && si <= 5,
  },
  {
    grade: "slightly-weak",
    label: "약신약",
    k: 0.44,
    targetScoreRange: [75, 89],
    description:
      "신중하고 계획적이며, 후천적인 대운에서 인성/비겁의 돕는 운이 들어올 때 발복하는 사주.",
    matches: (si) => si >= -30 && si < -5,
  },
  {
    grade: "extremely-weak",
    label: "극신약",
    k: 0.9,
    targetScoreRange: [30, 49],
    description:
      "주체성이 부족하여 쉽게 피로하고 예민하며, 타인에게 의존하거나 이용당하기 쉬운 사주.",
    matches: (si) => si < -30,
  },
];

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getStrengthGradeRule(si: number) {
  return STRENGTH_GRADE_RULES.find((rule) => rule.matches(si)) ?? STRENGTH_GRADE_RULES[2];
}

export function calculateStrengthIndex(
  result: SajuResult,
  elementQi: Pick<ElementQiResult, "totals" | "percentages">
): StrengthIndexResult {
  const dayMasterElement = getDayMasterElement(result);

  if (!dayMasterElement) {
    throw new Error("Cannot calculate strength index without a valid day master element.");
  }

  const roleQi = getElementRoleQi(dayMasterElement, elementQi);
  const supportQi = roleQi.insung.percentage + roleQi.bigeop.percentage * 1.1;
  const drainControlQi =
    roleQi.siksang.percentage +
    roleQi.jaeseong.percentage +
    roleQi.gwanseong.percentage * 1.1;
  const denominator = supportQi + drainControlQi;
  const si = denominator > 0 ? ((supportQi - drainControlQi) / denominator) * 100 : 0;
  const gradeRule = getStrengthGradeRule(si);
  const baseScore = 100 - Math.abs(OPTIMAL_SI - si) * gradeRule.k;

  return {
    dayMasterElement,
    roleQi,
    supportQi: round(supportQi, 2),
    drainControlQi: round(drainControlQi, 2),
    si: round(si, 2),
    grade: gradeRule.grade,
    gradeLabel: gradeRule.label,
    k: gradeRule.k,
    baseScore: round(clampScore(baseScore), 2),
    targetScoreRange: gradeRule.targetScoreRange,
    description: `${gradeRule.description} 역할별 기도: ${Object.values(roleQi)
      .map((item) => `${ELEMENT_ROLE_LABELS[item.role]} ${item.percentage.toFixed(2)}%`)
      .join(", ")}`,
  };
}
