import {
  BRANCH_ELEMENT,
  BRANCH_GWIMUN,
  BRANCH_WONJIN,
} from "@orrery/core/constants";
import type { SajuResult } from "@orrery/core/types";

import {
  ELEMENT_KEYS,
  applyDaewoonToElementQi,
  getElement,
  type ElementQiResult,
  type ElementRole,
} from "@/lib/saju/element-qi";
import { calculateStrengthIndex } from "@/lib/saju/strength-index";
import type { StrengthIndexResult } from "@/lib/saju/strength-index";
import type { YongshinResult } from "@/lib/saju/yongshin";
import type { LuckyScoreDetail } from "@/lib/lucky-day-types";

type Gender = "M" | "F";

export interface BaseScoringResult {
  score: number;
  rawScore: number;
  details: LuckyScoreDetail[];
}

interface DaewoonBaseScore {
  index: number;
  ganzi: string;
  si: number;
  gradeLabel: string;
  k: number;
  baseScore: number;
}

const SIPSIN_BY_ROLE: Record<ElementRole, string[]> = {
  bigeop: ["比肩", "劫財", "本元"],
  insung: ["偏印", "正印"],
  siksang: ["食神", "傷官"],
  jaeseong: ["偏財", "正財"],
  gwanseong: ["偏官", "正官"],
};

const TEN_STAR_CATEGORY: Record<string, ElementRole> = {
  "比肩": "bigeop",
  "劫財": "bigeop",
  "本元": "bigeop",
  "食神": "siksang",
  "傷官": "siksang",
  "偏財": "jaeseong",
  "正財": "jaeseong",
  "偏官": "gwanseong",
  "正官": "gwanseong",
  "偏印": "insung",
  "正印": "insung",
};

const DAY_JAEGO_PILLARS = new Set(["甲辰", "乙丑", "丁丑", "己丑", "庚戌", "辛未", "壬戌"]);
const JAEGO_BRANCHES = new Set(["辰", "戌", "丑", "未"]);
const CHEONRA_JIMANG = [
  ["戌", "亥"],
  ["辰", "巳"],
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getBranches(result: SajuResult) {
  return result.pillars.map((detail) => detail.pillar.branch);
}

function getStems(result: SajuResult) {
  return result.pillars.map((detail) => detail.pillar.stem);
}

function hasPair(table: Record<string, string>, first: string, second: string) {
  return `${first},${second}` in table || `${second},${first}` in table;
}

function getAdjacentBranchPairs(result: SajuResult) {
  const ordered = [result.pillars[3], result.pillars[2], result.pillars[1], result.pillars[0]];
  return ordered.slice(0, -1).map((item, index) => [item, ordered[index + 1]] as const);
}

function getAllSipsin(result: SajuResult) {
  return [
    ...result.pillars.flatMap((detail) => [detail.stemSipsin, detail.branchSipsin]),
    ...result.jwabeop.flatMap((branch) => branch.map((item) => item.sipsin)),
  ];
}

function hasAnySipsin(result: SajuResult, sipsins: string[]) {
  const set = new Set(getAllSipsin(result));
  return sipsins.some((item) => set.has(item));
}

function addDetail(
  details: LuckyScoreDetail[],
  label: string,
  value: number,
  description: string
) {
  if (value === 0) return;
  details.push({ label, value: round(value), description });
}

function scoreChapter10(
  result: SajuResult,
  elementQi: ElementQiResult,
  strength: StrengthIndexResult,
  gender: Gender
) {
  const details: LuckyScoreDetail[] = [];
  let score = 0;
  const allSipsin = getAllSipsin(result);
  const sipsinSet = new Set(allSipsin);
  const presentRoles = new Set<ElementRole>(
    allSipsin.map((item) => TEN_STAR_CATEGORY[item]).filter(Boolean)
  );
  const branches = getBranches(result);
  const stems = getStems(result);
  const branchElements = branches.map((branch) => BRANCH_ELEMENT[branch]).filter(Boolean);

  if (ELEMENT_KEYS.every((element) => stems.some((stem) => getElement(stem) === element) || branchElements.includes(element))) {
    score += 2;
    addDetail(details, "10장 오행 구족", 2, "원국 오행이 모두 존재합니다.");
  }

  if (presentRoles.has("siksang") && presentRoles.has("jaeseong") && presentRoles.has("gwanseong")) {
    score += 2;
    addDetail(details, "10장 식재관 유기통관", 2, "식상-재성-관성 흐름이 모두 존재합니다.");
  }

  if (sipsinSet.has("偏官") && sipsinSet.has("食神")) {
    score += 2;
    addDetail(details, "10장 식신제살", 2, "편관과 식신이 함께 존재합니다.");
  }

  if (sipsinSet.has("傷官") && (sipsinSet.has("正官") || sipsinSet.has("偏官"))) {
    score -= 1;
    addDetail(details, "10장 상관견관", -1, "상관과 관성이 동시에 존재합니다.");
  }

  if (sipsinSet.has("偏印") && sipsinSet.has("食神") && !presentRoles.has("jaeseong")) {
    score -= 3;
    addDetail(details, "10장 편인도식", -3, "편인과 식신이 함께 있고 재성 제어가 없습니다.");
  }

  const bigeopQi = strength.roleQi.bigeop.percentage;
  if (bigeopQi >= 40 && !hasAnySipsin(result, SIPSIN_BY_ROLE.gwanseong)) {
    score -= 2;
    addDetail(details, "10장 비겁태과 무관", -2, "비겁 기도가 40% 이상이고 관성이 없습니다.");
  }

  if (gender === "F" && !hasAnySipsin(result, SIPSIN_BY_ROLE.gwanseong)) {
    score -= 2;
    addDetail(details, "10장 여아 무관", -2, "여명 기준 관성이 없습니다.");
  }

  if (gender === "M" && !hasAnySipsin(result, SIPSIN_BY_ROLE.jaeseong)) {
    score -= 2;
    addDetail(details, "10장 남아 무재", -2, "남명 기준 재성이 없습니다.");
  }

  return { score, details };
}

const SINSAL_BY_DAY_BRANCH_GROUP = [
  { group: ["寅", "午", "戌"], branches: ["亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌"] },
  { group: ["申", "子", "辰"], branches: ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"] },
  { group: ["巳", "酉", "丑"], branches: ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"] },
  { group: ["亥", "卯", "未"], branches: ["申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未"] },
];
const SINSAL_NAMES = ["劫殺", "災殺", "天殺", "地殺", "年殺", "月殺", "亡身", "將星", "攀鞍", "驛馬", "六害", "華蓋"];

function getDayBranchSinsal(dayBranch: string, targetBranch: string) {
  const group = SINSAL_BY_DAY_BRANCH_GROUP.find((item) => item.group.includes(dayBranch));
  if (!group) return "?";
  const index = group.branches.indexOf(targetBranch);
  return index >= 0 ? SINSAL_NAMES[index] : "?";
}

function scoreChapter11(result: SajuResult) {
  const details: LuckyScoreDetail[] = [];
  let score = 0;
  const time = result.pillars[0];
  const day = result.pillars[1];
  const dayBranch = day.pillar.branch;
  const daySinsal = getDayBranchSinsal(dayBranch, day.pillar.branch);
  const timeSinsal = getDayBranchSinsal(dayBranch, time.pillar.branch);

  if (["長生", "乾祿", "建祿", "冠帶", "衰"].includes(time.unseong)) {
    score += 0.5;
    addDetail(details, "11장 시지 길성 안착", 0.5, `시지 12운성 ${time.unseong}`);
  }
  if (["長生", "乾祿", "建祿", "衰"].includes(day.unseong)) {
    score += 0.5;
    addDetail(details, "11장 일지 길성 배치", 0.5, `일지 12운성 ${day.unseong}`);
  }
  if (daySinsal === "攀鞍" || timeSinsal === "攀鞍") {
    score += 0.5;
    addDetail(details, "11장 반안살 안착", 0.5, "일지 또는 시지에 반안살이 배치되었습니다.");
  }
  if (["絶", "病", "死"].includes(time.unseong)) {
    score -= 0.5;
    addDetail(details, "11장 시지 무력", -0.5, `시지 12운성 ${time.unseong}`);
  }
  if (["沐浴", "絶"].includes(day.unseong)) {
    score -= 0.2;
    addDetail(details, "11장 일지 기복", -0.2, `일지 12운성 ${day.unseong}`);
  }

  return { score, details };
}

function scoreChapter12(result: SajuResult) {
  const details: LuckyScoreDetail[] = [];
  let score = 0;
  const branches = getBranches(result);
  const dayPillar = result.pillars[1].pillar.ganzi;

  const cheonulInner = result.specialSals.cheonul.filter((index) => index === 0 || index === 1).length;
  const cheonulOuter = result.specialSals.cheonul.filter((index) => index === 2 || index === 3).length;
  if (cheonulInner > 0) {
    const value = cheonulInner * 1.5;
    score += value;
    addDetail(details, "12장 천을귀인 일시지", value, "천을귀인이 일지 또는 시지에 있습니다.");
  }
  if (cheonulOuter > 0) {
    const value = cheonulOuter * 1;
    score += value;
    addDetail(details, "12장 천을귀인 연월지", value, "천을귀인이 연지 또는 월지에 있습니다.");
  }

  if (DAY_JAEGO_PILLARS.has(dayPillar)) {
    score += 1;
    addDetail(details, "12장 재고귀인 일지", 1, `${dayPillar} 재고귀인 일주입니다.`);
  }
  const otherJaego = branches.filter((branch, index) => index !== 1 && JAEGO_BRANCHES.has(branch)).length;
  if (otherJaego > 0) {
    const value = otherJaego * 0.5;
    score += value;
    addDetail(details, "12장 재고귀인 타지", value, "연지/월지/시지에 재고 지지가 있습니다.");
  }

  if (result.specialSals.cheonduk.length > 0 || result.specialSals.wolduk.length > 0) {
    score += 0.2;
    addDetail(details, "12장 천덕·월덕귀인", 0.2, "천덕 또는 월덕귀인을 보유합니다.");
  }
  if (result.specialSals.munchang.length > 0) {
    score += 0.1;
    addDetail(details, "12장 문창귀인", 0.1, "문창귀인을 보유합니다.");
  }
  if (result.specialSals.geumyeo.length > 0) {
    score += 0.2;
    addDetail(details, "12장 금여록", 0.2, "금여록을 보유합니다.");
  }

  for (const group of [["寅", "巳", "申"], ["丑", "戌", "未"]]) {
    if (group.every((branch) => branches.includes(branch))) {
      score -= 1.5;
      addDetail(details, "12장 삼형살", -1.5, `${group.join("")} 삼형살이 성립합니다.`);
      break;
    }
  }

  const cheonra = getAdjacentBranchPairs(result).some(([left, right]) => {
    const pair = [left.pillar.branch, right.pillar.branch];
    const hasPairMatch = CHEONRA_JIMANG.some((target) => target.every((branch) => pair.includes(branch)));
    const includesDayOrMonth = [left, right].some((item) => item === result.pillars[1] || item === result.pillars[2]);
    return hasPairMatch && includesDayOrMonth;
  });
  if (cheonra) {
    score -= 1;
    addDetail(details, "12장 천라지망", -1, "일지 또는 월지를 포함한 술해/진사 연속 배치가 있습니다.");
  }

  const dayBranch = result.pillars[1].pillar.branch;
  const monthBranch = result.pillars[2].pillar.branch;
  const timeBranch = result.pillars[0].pillar.branch;
  if (hasPair(BRANCH_WONJIN, dayBranch, monthBranch) || hasPair(BRANCH_WONJIN, dayBranch, timeBranch) || hasPair(BRANCH_GWIMUN, dayBranch, monthBranch) || hasPair(BRANCH_GWIMUN, dayBranch, timeBranch)) {
    score -= 1.5;
    addDetail(details, "12장 원진귀문", -1.5, "일지와 월지/시지 사이 원진 또는 귀문이 성립합니다.");
  }

  for (const index of result.gongmang.pillarIndices) {
    const sipsin = result.pillars[index].branchSipsin;
    if (["正官", "正印", "正財", "偏財"].includes(sipsin)) {
      score -= 0.5;
      addDetail(details, "12장 길성 공망", -0.5, `${sipsin} 지지가 공망입니다.`);
    } else {
      score -= 0.2;
      addDetail(details, "12장 기타 십성 공망", -0.2, `${sipsin} 지지가 공망입니다.`);
    }
  }

  return { score, details };
}

function calculateDaewoonBaseScores(
  result: SajuResult,
  elementQi: ElementQiResult
): DaewoonBaseScore[] {
  return result.daewoon.slice(0, 4).map((daewoon) => {
    const daewoonElementQi = applyDaewoonToElementQi(elementQi, daewoon);
    const daewoonStrength = calculateStrengthIndex(result, daewoonElementQi);

    return {
      index: daewoon.index,
      ganzi: daewoon.ganzi,
      si: daewoonStrength.si,
      gradeLabel: daewoonStrength.gradeLabel,
      k: daewoonStrength.k,
      baseScore: daewoonStrength.baseScore,
    };
  });
}

export function calculateBaseScoring(
  result: SajuResult,
  elementQi: ElementQiResult,
  strength: StrengthIndexResult,
  _yongshin: YongshinResult,
  gender: Gender
): BaseScoringResult {
  const chapter10 = scoreChapter10(result, elementQi, strength, gender);
  const chapter11 = scoreChapter11(result);
  const chapter12 = scoreChapter12(result);
  const adjustments = chapter10.score + chapter11.score + chapter12.score;
  const daewoonBaseScores = calculateDaewoonBaseScores(result, elementQi);
  const finalBaseScore =
    daewoonBaseScores.length > 0
      ? daewoonBaseScores.reduce((sum, item) => sum + item.baseScore, 0) / daewoonBaseScores.length
      : strength.baseScore;
  const rawScore = finalBaseScore + adjustments;
  const details: LuckyScoreDetail[] = [
    {
      label: "8장 Base Score 원국",
      value: strength.baseScore,
      description: `${strength.gradeLabel} SI ${strength.si.toFixed(2)}%, K=${strength.k}`,
    },
    {
      label: "8장 대운 평균 Base Score",
      value: finalBaseScore,
      description:
        daewoonBaseScores.length > 0
          ? daewoonBaseScores
              .map(
                (item) =>
                  `${item.index}대운 ${item.ganzi}: ${item.baseScore.toFixed(2)} (${item.gradeLabel} SI ${item.si.toFixed(2)}%, K=${item.k})`
              )
              .join(" / ")
          : "대운 데이터가 없어 원국 Base Score를 사용합니다.",
    },
    ...chapter10.details,
    ...chapter11.details,
    ...chapter12.details,
  ];

  return {
    score: round(clampScore(rawScore)),
    rawScore: round(rawScore),
    details,
  };
}
