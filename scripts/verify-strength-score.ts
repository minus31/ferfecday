import assert from "node:assert/strict";

import { calculateStrengthScore } from "@/lib/saju/strength-index";
import type { ElementQiKey } from "@/lib/saju/element-qi";

const balanced = {
  tree: 20,
  fire: 20,
  earth: 20,
  metal: 20,
  water: 20,
} satisfies Record<ElementQiKey, number>;

function score(
  percentages: Record<ElementQiKey, number>,
  si: number,
) {
  const drainControlQi = 50;
  return calculateStrengthScore({
    percentages,
    supportQi: drainControlQi * (si + 1),
    drainControlQi,
  });
}

function assertClose(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  );
}

const idealExample = score(
  { tree: 28, fire: 22, earth: 18, metal: 18, water: 14 },
  0.1,
);
assertClose(idealExample.sigma, 4.73);
assertClose(idealExample.sigmaScore, 40.53);
assert.equal(idealExample.siScore, 50);
assertClose(idealExample.baseScore, 90.53);

const boundaryCases = [
  { si: 0.5, grade: "extremely-strong", siScore: 25 },
  { si: 0.2, grade: "strong", siScore: 35 },
  { si: 0.05, grade: "slightly-strong", siScore: 50 },
  { si: -0.05, grade: "neutral", siScore: 45 },
  { si: -0.2, grade: "slightly-weak", siScore: 40 },
  { si: -0.5, grade: "weak", siScore: 35 },
  { si: -0.5001, grade: "extremely-weak", siScore: 20 },
] as const;

for (const testCase of boundaryCases) {
  const result = score(balanced, testCase.si);
  assert.equal(result.grade, testCase.grade, `SI ${testCase.si} grade`);
  assert.equal(result.siScore, testCase.siScore, `SI ${testCase.si} score`);
}

const exclusions = [
  {
    percentages: { tree: 60, fire: 20, earth: 20, metal: 0, water: 0 },
    baseScore: 0,
    reason: /0% 오행 2개/,
  },
  {
    percentages: { tree: 35, fire: 25, earth: 20, metal: 20, water: 0 },
    baseScore: 50,
    reason: /0% 오행 1개/,
  },
  {
    percentages: { tree: 50, fire: 20, earth: 15, metal: 10, water: 5 },
    baseScore: 0,
    reason: /50% 이상 오행 1개/,
  },
  {
    percentages: { tree: 40, fire: 40, earth: 10, metal: 5, water: 5 },
    baseScore: 20,
    reason: /40% 이상 오행 2개/,
  },
] satisfies Array<{
  percentages: Record<ElementQiKey, number>;
  baseScore: number;
  reason: RegExp;
}>;

for (const testCase of exclusions) {
  const result = score(testCase.percentages, 0.1);
  assert.equal(result.baseScore, testCase.baseScore);
  assert.match(result.exclusionReason ?? "", testCase.reason);
}

console.log("Strength scoring verification passed.");
