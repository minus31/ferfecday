import type { SajuResult } from "@orrery/core/types";

import {
  ELEMENT_KEYS,
  ELEMENT_ROLE_LABELS,
  getDayMasterElement,
  getElementRoleQi,
  type ElementQiKey,
  type ElementQiResult,
  type ElementRole,
  type ElementRoleQi,
} from "@/lib/saju/element-qi";

export type StrengthGrade =
  | "extremely-strong"
  | "strong"
  | "slightly-strong"
  | "neutral"
  | "slightly-weak"
  | "weak"
  | "extremely-weak";

export interface StrengthIndexResult {
  dayMasterElement: ElementQiKey;
  roleQi: Record<ElementRole, ElementRoleQi>;
  supportQi: number;
  drainControlQi: number;
  si: number;
  siScore: number;
  sigma: number;
  sigmaScore: number;
  grade: StrengthGrade;
  gradeLabel: string;
  baseScore: number;
  exclusionReason: string | null;
  description: string;
}

export interface StrengthScoreInput {
  percentages: Record<ElementQiKey, number>;
  supportQi: number;
  drainControlQi: number;
}

export interface StrengthScoreResult {
  si: number;
  siScore: number;
  sigma: number;
  sigmaScore: number;
  grade: StrengthGrade;
  gradeLabel: string;
  baseScore: number;
  exclusionReason: string | null;
}

interface StrengthGradeRule {
  grade: StrengthGrade;
  label: string;
  siScore: number;
  description: string;
  matches: (si: number) => boolean;
}

const STRENGTH_GRADE_RULES: StrengthGradeRule[] = [
  {
    grade: "extremely-strong",
    label: "극신강",
    siScore: 25,
    description: "생조가 극설보다 매우 강한 구조입니다.",
    matches: (si) => si >= 0.5,
  },
  {
    grade: "strong",
    label: "신강",
    siScore: 35,
    description: "생조가 극설보다 강한 구조입니다.",
    matches: (si) => si >= 0.2,
  },
  {
    grade: "slightly-strong",
    label: "약신강",
    siScore: 50,
    description: "생조가 극설보다 조금 강한 구조입니다.",
    matches: (si) => si >= 0.05,
  },
  {
    grade: "neutral",
    label: "중화",
    siScore: 45,
    description: "생조와 극설이 균형에 가까운 구조입니다.",
    matches: (si) => si >= -0.05,
  },
  {
    grade: "slightly-weak",
    label: "약신약",
    siScore: 40,
    description: "극설이 생조보다 조금 강한 구조입니다.",
    matches: (si) => si >= -0.2,
  },
  {
    grade: "weak",
    label: "신약",
    siScore: 35,
    description: "극설이 생조보다 강한 구조입니다.",
    matches: (si) => si >= -0.5,
  },
  {
    grade: "extremely-weak",
    label: "극신약",
    siScore: 20,
    description: "극설이 생조보다 매우 강한 구조입니다.",
    matches: () => true,
  },
];

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getStrengthGradeRule(si: number) {
  return STRENGTH_GRADE_RULES.find((rule) => rule.matches(si)) as StrengthGradeRule;
}

function getExclusion(
  percentages: Record<ElementQiKey, number>,
): { score: number; reason: string } | null {
  const values = ELEMENT_KEYS.map((element) => percentages[element]);
  const zeroCount = values.filter((value) => value === 0).length;
  const over50Count = values.filter((value) => value >= 50).length;
  const over40Count = values.filter((value) => value >= 40).length;

  if (zeroCount >= 2) {
    return { score: 0, reason: `기도비율 0% 오행 ${zeroCount}개` };
  }
  if (over50Count >= 1) {
    return { score: 0, reason: `기도비율 50% 이상 오행 ${over50Count}개` };
  }
  if (over40Count >= 2) {
    return { score: 20, reason: `기도비율 40% 이상 오행 ${over40Count}개` };
  }
  if (zeroCount === 1) {
    return { score: 50, reason: "기도비율 0% 오행 1개" };
  }
  return null;
}

/**
 * 오행 기도와 생조, 극설을 Base Score로 변환한다.
 * sigma 계수는 요구 예시(4.73% -> 40.5점)에 맞춰 2를 사용한다.
 */
export function calculateStrengthScore({
  percentages,
  supportQi,
  drainControlQi,
}: StrengthScoreInput): StrengthScoreResult {
  const exclusion = getExclusion(percentages);
  const si = drainControlQi > 0
    ? (supportQi - drainControlQi) / drainControlQi
    : 0;
  const gradeRule = getStrengthGradeRule(si);
  const sigma = Math.sqrt(
    ELEMENT_KEYS.reduce(
      (sum, element) => sum + (percentages[element] - 20) ** 2,
      0,
    ) / ELEMENT_KEYS.length,
  );
  const sigmaScore = Math.max(50 - sigma * 2, 0);
  const baseScore = exclusion?.score ?? Math.min(gradeRule.siScore + sigmaScore, 100);

  return {
    si: round(si, 4),
    siScore: gradeRule.siScore,
    sigma: round(sigma, 2),
    sigmaScore: round(sigmaScore, 2),
    grade: gradeRule.grade,
    gradeLabel: gradeRule.label,
    baseScore: round(baseScore, 2),
    exclusionReason: exclusion?.reason ?? null,
  };
}

export function calculateStrengthIndex(
  result: SajuResult,
  elementQi: Pick<ElementQiResult, "totals" | "percentages">,
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
  const scoring = calculateStrengthScore({
    percentages: elementQi.percentages,
    supportQi,
    drainControlQi,
  });
  const exclusionText = scoring.exclusionReason
    ? ` 연산 배제 조건(${scoring.exclusionReason})을 적용해 Base Score를 ${scoring.baseScore}점으로 고정했습니다.`
    : ` SI 점수 ${scoring.siScore}점과 기도 편차 점수 ${scoring.sigmaScore}점을 합산했습니다.`;

  return {
    dayMasterElement,
    roleQi,
    supportQi: round(supportQi, 2),
    drainControlQi: round(drainControlQi, 2),
    ...scoring,
    description: `${STRENGTH_GRADE_RULES.find((rule) => rule.grade === scoring.grade)?.description ?? ""}${exclusionText} 역할별 기도: ${Object.values(roleQi)
      .map((item) => `${ELEMENT_ROLE_LABELS[item.role]} ${item.percentage.toFixed(2)}%`)
      .join(", ")}`,
  };
}
