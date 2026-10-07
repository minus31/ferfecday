import assert from "node:assert/strict";
import { calculateLuckyDays } from "../lib/lucky-days";
import {
  buildProductReport,
  buildProductSummary,
  validateProductReport,
  INTERNAL_COPY,
  reportGroundingIssues,
} from "../lib/saju/product-report";
import {
  buildNatalEvidence,
  buildSixStepAnalysis,
  getCharacterElement,
  getTenGodEvidence,
} from "../lib/saju/natal-evidence";
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
const realDays = calculateLuckyDays({
  from: "2026-09-17",
  to: "2026-09-17",
  gender: "F",
  location: "서울",
}).results;
assert.equal(new Set(realDays.map(buildProductSummary)).size, realDays.length);
const laterDate = new Date(Date.UTC(2026, 8, 17) + 60 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const laterDay = calculateLuckyDays({
  from: laterDate,
  to: laterDate,
  gender: "F",
  location: "서울",
}).results[0];
assert.equal(realDays[0].dayPillar, laterDay.dayPillar);
assert.notEqual(realDays[0].pillars[2].branch, laterDay.pillars[2].branch);
assert.notEqual(
  buildProductSummary(realDays[0]),
  buildProductSummary(laterDay),
);
assert.notEqual(
  buildProductReport(realDays[0]).sections[0].body,
  buildProductReport(laterDay).sections[0].body,
);
for (const day of realDays) {
  const grounded = buildProductReport(day);
  assert.ok(validateProductReport(grounded, day));
  assert.deepEqual(reportGroundingIssues(grounded, day), []);
  assert.ok(buildProductSummary(day).includes(day.pillars[0].ganziHangul));
  const tenGods = getTenGodEvidence(day);
  const analysis = buildSixStepAnalysis(day);
  assert.equal(analysis.length, 6);
  assert.equal(new Set(analysis.map((step) => step.step)).size, 6);
  assert.ok(analysis[0].evidence.includes(day.pillars[1].stem));
  assert.ok(analysis[1].evidence.includes(day.pillars[2].branch));
  assert.ok(analysis[5].evidence.includes(day.daewoon[0].ganziHangul));
  assert.ok(
    analysis.every((step) => !/\b(?:undefined|null)\b/.test(step.evidence)),
  );
  assert.ok(
    !buildNatalEvidence(day).missing.includes(
      buildNatalEvidence(day).dayMasterElement,
    ),
  );
  assert.equal(tenGods.length, 5);
  assert.equal(tenGods.flatMap((group) => group.gods).length, 10);
  for (const group of tenGods)
    for (const god of group.gods)
      for (const position of [...god.visible, ...god.hidden])
        assert.ok(day.pillars.some((pillar) => position.includes(pillar.name)));
  for (const pillar of day.pillars)
    for (const char of (pillar.stem + pillar.branch + pillar.jigang).match(
      /[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g,
    ) ?? [])
      assert.ok(getCharacterElement(char), `${char}의 오행 누락`);
}
assert.doesNotMatch(
  buildProductSummary(sample),
  /다섯 오행이 모두 자리|한 가지 재능에 머물기보다/,
);
const wrongMaster = structuredClone(report);
wrongMaster.sections[1].body += `\n\n${sample.pillars[1].stem === "甲" ? "乙" : "甲"} 일간은 계절의 도움을 받습니다.`;
assert.equal(validateProductReport(wrongMaster, sample), false);
const wrongMonth = structuredClone(report);
wrongMonth.sections[1].body += `\n\n${sample.pillars[2].branch === "子" ? "丑" : "子"} 월지에 기운이 자리합니다.`;
assert.equal(validateProductReport(wrongMonth, sample), false);
const awkwardCopy = structuredClone(report);
awkwardCopy.sections[1].body +=
  "\n\n한 가지 재능에 머물기보다 자기 방식으로 배우고 사람들과 조화를 찾습니다.";
assert.equal(validateProductReport(awkwardCopy, sample), false);
const unverifiedPattern = structuredClone(report);
unverifiedPattern.sections[1].body +=
  "\n\n식상생재가 성립해 큰 재물을 얻습니다.";
assert.equal(validateProductReport(unverifiedPattern, sample), false);
const missingElement = structuredClone(report);
const incompleteDay = structuredClone(sample);
incompleteDay.pillars = incompleteDay.pillars.map((pillar) => ({
  ...pillar,
  stem: "甲",
  branch: "寅",
  jigang: "甲乙",
}));
missingElement.sections[1].body += "\n\n다섯 오행이 모두 자리합니다.";
assert.ok(buildNatalEvidence(incompleteDay).missing.length > 0);
assert.ok(
  reportGroundingIssues(missingElement, incompleteDay).includes(
    "원국에 없는 오행을 모두 있다고 서술",
  ),
);
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
