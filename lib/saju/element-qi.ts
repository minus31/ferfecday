import {
  BRANCH_CLASHES,
  STEM_CLASHES,
  STEM_COMBINES,
  STEM_INFO,
} from "@orrery/core/constants";
import type { SajuResult } from "@orrery/core/types";

export type ElementQiKey = "tree" | "fire" | "earth" | "metal" | "water";

export type PillarPosition = "year" | "month" | "day" | "time";

export interface ElementQiBreakdown {
  source: "stem" | "hidden-stem" | "stem-combine";
  position?: PillarPosition;
  stem?: string;
  branch?: string;
  element: ElementQiKey;
  base: number;
  weight: number;
  value: number;
  reasons: string[];
}

export interface ElementQiResult {
  totals: Record<ElementQiKey, number>;
  percentages: Record<ElementQiKey, number>;
  missing: ElementQiKey[];
  total: number;
  breakdown: ElementQiBreakdown[];
}

const ELEMENT_KEYS: ElementQiKey[] = ["tree", "fire", "earth", "metal", "water"];
const HEAVENLY_STEM_BASE = 0.7;

const GENERATES: Record<ElementQiKey, ElementQiKey> = {
  tree: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "tree",
};

const CONTROLS: Record<ElementQiKey, ElementQiKey> = {
  tree: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "tree",
};

const POSITION_LABEL: Record<PillarPosition, string> = {
  year: "연주",
  month: "월주",
  day: "일주",
  time: "시주",
};

const HIDDEN_STEM_RATIOS: Record<
  string,
  Array<{ stem: string; element: ElementQiKey; ratio: number }>
> = {
  "子": [
    { stem: "壬", element: "water", ratio: 1 },
    { stem: "癸", element: "water", ratio: 0 },
  ],
  "丑": [
    { stem: "癸", element: "water", ratio: 0.3 },
    { stem: "辛", element: "metal", ratio: 0.1 },
    { stem: "己", element: "earth", ratio: 0.6 },
  ],
  "寅": [
    { stem: "戊", element: "earth", ratio: 0.233 },
    { stem: "丙", element: "fire", ratio: 0.233 },
    { stem: "甲", element: "tree", ratio: 0.534 },
  ],
  "卯": [
    { stem: "甲", element: "tree", ratio: 1 },
    { stem: "乙", element: "tree", ratio: 0 },
  ],
  "辰": [
    { stem: "乙", element: "tree", ratio: 0.3 },
    { stem: "癸", element: "water", ratio: 0.1 },
    { stem: "戊", element: "earth", ratio: 0.6 },
  ],
  "巳": [
    { stem: "戊", element: "earth", ratio: 0.233 },
    { stem: "庚", element: "metal", ratio: 0.233 },
    { stem: "丙", element: "fire", ratio: 0.534 },
  ],
  "午": [
    { stem: "丙", element: "fire", ratio: 0.7 },
    { stem: "己", element: "earth", ratio: 0.3 },
    { stem: "丁", element: "fire", ratio: 0 },
  ],
  "未": [
    { stem: "丁", element: "fire", ratio: 0.3 },
    { stem: "乙", element: "tree", ratio: 0.1 },
    { stem: "己", element: "earth", ratio: 0.6 },
  ],
  "申": [
    { stem: "戊", element: "earth", ratio: 0.233 },
    { stem: "壬", element: "water", ratio: 0.233 },
    { stem: "庚", element: "metal", ratio: 0.534 },
  ],
  "酉": [
    { stem: "庚", element: "metal", ratio: 1 },
    { stem: "辛", element: "metal", ratio: 0 },
  ],
  "戌": [
    { stem: "辛", element: "metal", ratio: 0.3 },
    { stem: "丁", element: "fire", ratio: 0.1 },
    { stem: "戊", element: "earth", ratio: 0.6 },
  ],
  "亥": [
    { stem: "戊", element: "earth", ratio: 0.233 },
    { stem: "甲", element: "tree", ratio: 0.233 },
    { stem: "壬", element: "water", ratio: 0.534 },
  ],
};

const TRIPLE_GROUPS = [
  { branches: ["寅", "午", "戌"], center: "午" },
  { branches: ["申", "子", "辰"], center: "子" },
  { branches: ["亥", "卯", "未"], center: "卯" },
  { branches: ["巳", "酉", "丑"], center: "酉" },
];

const HALF_GROUPS = [
  { branches: ["寅", "午"], center: "午" },
  { branches: ["午", "戌"], center: "午" },
  { branches: ["申", "子"], center: "子" },
  { branches: ["子", "辰"], center: "子" },
  { branches: ["亥", "卯"], center: "卯" },
  { branches: ["卯", "未"], center: "卯" },
  { branches: ["巳", "酉"], center: "酉" },
  { branches: ["酉", "丑"], center: "酉" },
];

function emptyElementValues(): Record<ElementQiKey, number> {
  return {
    tree: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
}

function getElement(stem: string) {
  return STEM_INFO[stem]?.element as ElementQiKey | undefined;
}

function relationKey(first: string, second: string) {
  return `${first},${second}`;
}

function hasPair(
  table: Record<string, unknown>,
  first: string,
  second: string
) {
  return relationKey(first, second) in table || relationKey(second, first) in table;
}

function getStemCombineElement(first: string, second: string) {
  const direct = STEM_COMBINES[relationKey(first, second)];
  if (direct) return direct[1] as ElementQiKey;

  const reverse = STEM_COMBINES[relationKey(second, first)];
  return reverse?.[1] as ElementQiKey | undefined;
}

function isGeneratedBy(source: ElementQiKey, target: ElementQiKey) {
  return GENERATES[source] === target;
}

function isControlledBy(source: ElementQiKey, target: ElementQiKey) {
  return CONTROLS[source] === target;
}

function branchHasElement(branch: string, element: ElementQiKey) {
  return HIDDEN_STEM_RATIOS[branch]?.some(
    (hidden) => hidden.ratio > 0 && hidden.element === element
  );
}

function normalizePercentages(totals: Record<ElementQiKey, number>) {
  const total = ELEMENT_KEYS.reduce((sum, key) => sum + totals[key], 0);
  const percentages = emptyElementValues();

  for (const key of ELEMENT_KEYS) {
    percentages[key] = total > 0 ? (totals[key] / total) * 100 : 0;
  }

  return { total, percentages };
}

function roundRecord(values: Record<ElementQiKey, number>, digits: number) {
  const factor = 10 ** digits;
  const rounded = emptyElementValues();

  for (const key of ELEMENT_KEYS) {
    rounded[key] = Math.round(values[key] * factor) / factor;
  }

  return rounded;
}

function getOrderedPillars(result: SajuResult) {
  return [
    { position: "year" as const, detail: result.pillars[3] },
    { position: "month" as const, detail: result.pillars[2] },
    { position: "day" as const, detail: result.pillars[1] },
    { position: "time" as const, detail: result.pillars[0] },
  ];
}

function getAdjacentPairs<T>(items: T[]) {
  return items.slice(0, -1).map((item, index) => [item, items[index + 1]] as const);
}

function getStemWeight(
  stem: string,
  position: PillarPosition,
  sittingBranch: string,
  branches: Record<PillarPosition, string>,
  stemPenaltyMap: Map<PillarPosition, string[]>
) {
  const element = getElement(stem);
  if (!element) return { weight: 0, reasons: [] };

  let weight = 0;
  const reasons: string[] = [];

  if (branchHasElement(branches.month, element)) {
    weight += 0.2;
    reasons.push("월지 통근 +20%");
  }
  if (branchHasElement(branches.day, element)) {
    weight += 0.14;
    reasons.push("일지 통근 +14%");
  }
  for (const rootPosition of ["year", "time"] as const) {
    if (branchHasElement(branches[rootPosition], element)) {
      weight += 0.08;
      reasons.push(`${POSITION_LABEL[rootPosition]} 통근 +8%`);
    }
  }

  const sittingElement = HIDDEN_STEM_RATIOS[sittingBranch]?.at(-1)?.element;
  if (sittingElement === element) {
    weight += 0.05;
    reasons.push("비겁 득세 +5%");
  } else if (sittingElement && isGeneratedBy(sittingElement, element)) {
    weight += 0.02;
    reasons.push("인성 득세 +2%");
  } else if (sittingElement && isControlledBy(sittingElement, element)) {
    weight -= 0.05;
    reasons.push("좌하 극 -5%");
  } else if (sittingElement && (isGeneratedBy(element, sittingElement) || isControlledBy(element, sittingElement))) {
    weight -= 0.02;
    reasons.push("좌하 설기 -2%");
  }

  for (const reason of stemPenaltyMap.get(position) ?? []) {
    weight -= 0.05;
    reasons.push(reason);
  }

  return { weight, reasons };
}

function getStemRelationAdjustments(
  ordered: ReturnType<typeof getOrderedPillars>,
  branches: Record<PillarPosition, string>
) {
  const penalties = new Map<PillarPosition, string[]>();
  const combineBonuses: ElementQiBreakdown[] = [];

  for (const [left, right] of getAdjacentPairs(ordered)) {
    const leftStem = left.detail.pillar.stem;
    const rightStem = right.detail.pillar.stem;

    if (hasPair(STEM_CLASHES, leftStem, rightStem)) {
      for (const item of [left, right]) {
        penalties.set(item.position, [
          ...(penalties.get(item.position) ?? []),
          "인접 천간 충 -5%",
        ]);
      }
      continue;
    }

    const combineElement = getStemCombineElement(leftStem, rightStem);
    if (!combineElement) continue;

    const hasRoot =
      branchHasElement(branches.month, combineElement) ||
      branchHasElement(left.detail.pillar.branch, combineElement) ||
      branchHasElement(right.detail.pillar.branch, combineElement);

    for (const item of [left, right]) {
      penalties.set(item.position, [
        ...(penalties.get(item.position) ?? []),
        hasRoot ? "인접 천간 합화 -5%" : "인접 천간 합반 -5%",
      ]);
    }

    if (hasRoot) {
      combineBonuses.push({
        source: "stem-combine",
        element: combineElement,
        base: HEAVENLY_STEM_BASE,
        weight: 0.2,
        value: HEAVENLY_STEM_BASE * 0.2,
        reasons: [`${leftStem}${rightStem} 합화 ${combineElement} +20%`],
      });
    }
  }

  return { penalties, combineBonuses };
}

function getBranchWeightMaps(ordered: ReturnType<typeof getOrderedPillars>) {
  const weights = new Map<PillarPosition, number>();
  const reasons = new Map<PillarPosition, string[]>();
  const add = (position: PillarPosition, weight: number, reason: string) => {
    weights.set(position, (weights.get(position) ?? 0) + weight);
    reasons.set(position, [...(reasons.get(position) ?? []), reason]);
  };

  add("month", 0.15, "월지 사령 +15%");
  add("day", 0.08, "일지 안착 +8%");

  for (const [left, right] of getAdjacentPairs(ordered)) {
    if (hasPair(BRANCH_CLASHES, left.detail.pillar.branch, right.detail.pillar.branch)) {
      add(left.position, -0.05, "지지 정면 충 -5%");
      add(right.position, -0.05, "지지 정면 충 -5%");
    }
  }

  const branchSet = new Set(ordered.map((item) => item.detail.pillar.branch));
  const fullTripleGroups = TRIPLE_GROUPS.filter((group) =>
    group.branches.every((branch) => branchSet.has(branch))
  );

  for (const group of fullTripleGroups) {
    for (const item of ordered) {
      const branch = item.detail.pillar.branch;
      if (!group.branches.includes(branch)) continue;

      if (branch === group.center) {
        add(item.position, 0.2, "지지 삼합 왕지 가중 +20%");
      } else {
        add(item.position, -0.1, "생지/고지 변질 -10%");
      }
    }
  }

  for (const [left, right] of getAdjacentPairs(ordered)) {
    const pair = [left.detail.pillar.branch, right.detail.pillar.branch];
    const halfGroup = HALF_GROUPS.find(
      (group) => group.branches.every((branch) => pair.includes(branch)) &&
        !fullTripleGroups.some((triple) =>
          group.branches.every((branch) => triple.branches.includes(branch))
        )
    );

    if (!halfGroup) continue;

    for (const item of [left, right]) {
      if (item.detail.pillar.branch === halfGroup.center) {
        add(item.position, 0.08, "지지 반합 왕지 가중 +8%");
      } else {
        add(item.position, -0.1, "생지/고지 변질 -10%");
      }
    }
  }

  return { weights, reasons };
}

export function calculateElementQi(result: SajuResult): ElementQiResult {
  const ordered = getOrderedPillars(result);
  const branches = Object.fromEntries(
    ordered.map((item) => [item.position, item.detail.pillar.branch])
  ) as Record<PillarPosition, string>;
  const totals = emptyElementValues();
  const breakdown: ElementQiBreakdown[] = [];

  const { penalties: stemPenalties, combineBonuses } = getStemRelationAdjustments(
    ordered,
    branches
  );

  for (const item of ordered) {
    if (item.position === "day") continue;

    const stem = item.detail.pillar.stem;
    const element = getElement(stem);
    if (!element) continue;

    const { weight, reasons } = getStemWeight(
      stem,
      item.position,
      item.detail.pillar.branch,
      branches,
      stemPenalties
    );
    const value = HEAVENLY_STEM_BASE * (1 + weight);
    totals[element] += value;
    breakdown.push({
      source: "stem",
      position: item.position,
      stem,
      branch: item.detail.pillar.branch,
      element,
      base: HEAVENLY_STEM_BASE,
      weight,
      value,
      reasons,
    });
  }

  for (const bonus of combineBonuses) {
    totals[bonus.element] += bonus.value;
    breakdown.push(bonus);
  }

  const branchWeights = getBranchWeightMaps(ordered);

  for (const item of ordered) {
    const branch = item.detail.pillar.branch;
    const weight = branchWeights.weights.get(item.position) ?? 0;
    const reasons = branchWeights.reasons.get(item.position) ?? [];

    for (const hidden of HIDDEN_STEM_RATIOS[branch] ?? []) {
      if (hidden.ratio <= 0) continue;

      const value = hidden.ratio * (1 + weight);
      totals[hidden.element] += value;
      breakdown.push({
        source: "hidden-stem",
        position: item.position,
        stem: hidden.stem,
        branch,
        element: hidden.element,
        base: hidden.ratio,
        weight,
        value,
        reasons,
      });
    }
  }

  const normalized = normalizePercentages(totals);

  return {
    totals: roundRecord(totals, 4),
    percentages: roundRecord(normalized.percentages, 2),
    missing: ELEMENT_KEYS.filter((key) => totals[key] <= 0),
    total: Math.round(normalized.total * 10000) / 10000,
    breakdown: breakdown.map((item) => ({
      ...item,
      base: Math.round(item.base * 10000) / 10000,
      weight: Math.round(item.weight * 10000) / 10000,
      value: Math.round(item.value * 10000) / 10000,
    })),
  };
}
