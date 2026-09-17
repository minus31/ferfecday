import assert from "node:assert/strict";
import { calculateLuckyDays } from "../lib/lucky-days";
import {
  buildProductReport,
  buildProductSummary,
  validateProductReport,
  INTERNAL_COPY,
} from "../lib/saju/product-report";
import {
  DAY_PILLARS,
  getDayPillarProfile,
} from "../lib/saju/day-pillar-profiles";
import { collectStars } from "../lib/saju/stars";
import { getDaewoonPeriod } from "../lib/saju/daewoon-ai";
const sample = calculateLuckyDays({
  from: "2026-09-17",
  to: "2026-09-19",
  gender: "F",
  location: "서울",
}).results[0];
let min = Infinity,
  max = 0;
for (const dayPillar of DAY_PILLARS) {
  const day = {
    ...sample,
    dayPillar,
    dayPillarHangul: getDayPillarProfile(dayPillar)!.name.replace("일주", ""),
  };
  const report = buildProductReport(day);
  assert.ok(
    validateProductReport(report, day),
    `${dayPillar}: ${report.sections.map((s) => `${s.id}=${s.body.length}`).join(",")}`,
  );
  assert.doesNotMatch(buildProductSummary(day), INTERNAL_COPY);
  for (const section of report.sections) {
    assert.doesNotMatch(section.body, INTERNAL_COPY);
    min = Math.min(min, section.body.length);
    max = Math.max(max, section.body.length);
    if (["learning", "career"].includes(section.id))
      assert.ok(section.body.length >= 900);
  }
  for (const period of report.periods) {
    if (getDaewoonPeriod(day, period.index)!.ageRange[0] >= 19)
      assert.doesNotMatch(period.body, /아기|아이(?:가|는|를|에게|의)|훈육/);
  }
}
const pairDay = structuredClone(sample);
pairDay.pillars[1].branch = "丑";
pairDay.pillars[2].branch = "午";
pairDay.relations.pairs = [];
pairDay.gongmang.pillarIndices = [0];
const stars = collectStars(pairDay);
assert.ok(stars.pillars[1].includes("원진살"));
assert.ok(stars.pillars[2].includes("귀문관살"));
assert.ok(stars.pillars[0].includes("공망"));
assert.ok(stars.relations.some((s) => s.includes("일주 ↔ 월주, 지지 원진살")));
for (const [key, value] of Object.entries(pairDay.specialSals))
  if (Array.isArray(value))
    assert.ok(
      value.every((index) => stars.pillars[index].length > 0),
      key,
    );
const report = buildProductReport(sample);
for (const bad of [
  null,
  {},
  { ...report, sections: [null, ...report.sections.slice(1)] },
  { ...report, periods: report.periods.slice(1) },
  {
    ...report,
    sections: report.sections.map((s, i) =>
      i === 2 ? { ...s, body: s.body + " 33.3%" } : s,
    ),
  },
])
  assert.equal(validateProductReport(bad, sample), false);
console.log(
  `PASS: 60일주 × 12장, 전체 대운 연령 표현, 내부 수치 금지, 학업/직업 900자 이상, 원진/귀문/공망. 본문 ${min}~${max}자`,
);
