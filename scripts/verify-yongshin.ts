import assert from "node:assert/strict";

import type { SajuResult } from "@orrery/core/types";

import { calculateElementQi, type ElementQiResult } from "@/lib/saju/element-qi";
import { calculateStrengthIndex, type StrengthIndexResult } from "@/lib/saju/strength-index";
import { calculateYongshin } from "@/lib/saju/yongshin";

function makeResult(stems: string, branches: string) {
  return {
    pillars: [...stems].map((stem, index) => ({
      pillar: {
        stem,
        branch: [...branches][index],
        ganzi: `${stem}${[...branches][index]}`,
      },
    })),
    daewoon: [],
  } as unknown as SajuResult;
}

function calculate(stems: string, branches: string) {
  const result = makeResult(stems, branches);
  const elementQi = calculateElementQi(result);
  const strength = calculateStrengthIndex(result, elementQi);
  return {
    elementQi,
    strength,
    yongshin: calculateYongshin(result, elementQi, strength),
  };
}

const firstCase = calculate("甲乙丙丙", "申亥申午");
assert.equal(firstCase.yongshin.element, "water");
assert.equal(firstCase.yongshin.representativeChar, "亥");
assert.equal(firstCase.yongshin.representativeSource, "branch");
assert.match(firstCase.yongshin.message, /해\(亥\)/);

const secondCase = calculate("己乙丙丙", "卯亥申午");
assert.equal(secondCase.yongshin.element, "water");
assert.equal(secondCase.yongshin.representativeChar, "亥");
assert.equal(secondCase.yongshin.representativeSource, "branch");
assert.match(secondCase.yongshin.message, /해\(亥\)/);

const templateResult = makeResult("甲乙丙丙", "申亥申午");

function withElementPercentages(
  percentages: ElementQiResult["percentages"],
): ElementQiResult {
  return { ...firstCase.elementQi, percentages };
}

function withRolePercentages(
  si: number,
  percentages: Record<keyof StrengthIndexResult["roleQi"], number>,
): StrengthIndexResult {
  return {
    ...firstCase.strength,
    si,
    roleQi: Object.fromEntries(
      Object.entries(firstCase.strength.roleQi).map(([role, value]) => [
        role,
        { ...value, percentage: percentages[role as keyof typeof percentages] },
      ]),
    ) as StrengthIndexResult["roleQi"],
  };
}

const johuElementQi = withElementPercentages({
  tree: 10,
  fire: 45,
  earth: 10,
  metal: 10,
  water: 25,
});
const absoluteGapJohu = calculateYongshin(templateResult, johuElementQi, firstCase.strength);
assert.equal(absoluteGapJohu.method, "johu");
assert.equal(absoluteGapJohu.element, "water");

const balancedTemperature = withElementPercentages({
  tree: 20,
  fire: 20,
  earth: 20,
  metal: 20,
  water: 20,
});

const weakWithExcessiveOutput = calculateYongshin(
  templateResult,
  balancedTemperature,
  withRolePercentages(-0.2, {
    bigeop: 20,
    insung: 10,
    siksang: 35,
    jaeseong: 20,
    gwanseong: 15,
  }),
);
assert.equal(weakWithExcessiveOutput.role, "insung");
assert.equal(weakWithExcessiveOutput.element, "water");

const weakWithExcessiveWealth = calculateYongshin(
  templateResult,
  balancedTemperature,
  withRolePercentages(-0.2, {
    bigeop: 10,
    insung: 25,
    siksang: 15,
    jaeseong: 35,
    gwanseong: 15,
  }),
);
assert.equal(weakWithExcessiveWealth.role, "bigeop");
assert.equal(weakWithExcessiveWealth.element, "tree");

const strongWithDominantResource = calculateYongshin(
  templateResult,
  balancedTemperature,
  withRolePercentages(0.2, {
    bigeop: 20,
    insung: 25,
    siksang: 30,
    jaeseong: 10,
    gwanseong: 40,
  }),
);
assert.equal(strongWithDominantResource.role, "siksang");
assert.equal(strongWithDominantResource.element, "fire");

console.log("yongshin verification: ok");
