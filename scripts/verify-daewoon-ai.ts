import assert from "node:assert/strict";

import { calculateLuckyDays } from "@/lib/lucky-days";
import {
  buildDaewoonNarrativeRequest,
  buildLocalDaewoonNarrative,
  getDaewoonLifeStage,
  getDaewoonPeriod,
  parseDaewoonNarrative,
} from "@/lib/saju/daewoon-ai";
import { SAJU_REPORT_MODEL } from "@/lib/saju/report-ai";

const response = calculateLuckyDays({
  from: "2026-08-20",
  to: "2026-08-22",
  gender: "F",
  location: "서울",
});
const day = response.results[0];
const selected = day.daewoon[2];
const period = getDaewoonPeriod(day, selected.index);

assert.ok(period);
assert.equal(period.daewoon.index, selected.index);
assert.equal(period.ageRange[0], selected.age);
assert.equal(period.yearRange[1] - period.yearRange[0] + 1, period.annualFortunes.length);
assert.ok(period.annualFortunes.every(
  (item) => item.year >= period.yearRange[0] && item.year <= period.yearRange[1],
));

const request = buildDaewoonNarrativeRequest(day, selected.index);
assert.ok(request);
assert.equal(request.model, SAJU_REPORT_MODEL);
assert.equal(request.task, "daewoon_child_fortune");
assert.equal(request.report.selectedPeriod.daewoon.index, selected.index);
assert.deepEqual(request.report.selectedPeriod.yearRange, period.yearRange);
assert.equal(request.report.selectedPeriod.annualFortunes.length, period.annualFortunes.length);
assert.equal(request.report.selectedPeriod.lifeStage.key, getDaewoonLifeStage(period.ageRange).key);

const localNarrative = buildLocalDaewoonNarrative(day, selected.index);
assert.ok(localNarrative);
assert.equal(localNarrative.paragraphs.length, 2);
assert.ok(localNarrative.content.length >= 240);
for (const daewoon of day.daewoon) {
  const currentPeriod = getDaewoonPeriod(day, daewoon.index);
  const fallback = buildLocalDaewoonNarrative(day, daewoon.index);
  assert.ok(currentPeriod);
  assert.ok(fallback, `${daewoon.index}번 성장 흐름의 기본 해설이 없습니다.`);
  assert.equal(fallback.paragraphs.length, 2);
  assert.ok(fallback.content.length >= 240);
  assert.ok(fallback.content.length <= 650);
  assert.match(fallback.content, new RegExp(`${currentPeriod.daewoon.ganziHangul}\\(${currentPeriod.daewoon.ganzi}\\)`));
  assert.match(fallback.content, new RegExp(String(currentPeriod.annualFortunes[0].year)));
  assert.match(fallback.content, new RegExp(String(currentPeriod.annualFortunes.at(-1)?.year)));
  const sentenceCount = (fallback.content.match(/[.!?](?:\s|$)/g) ?? []).length;
  assert.ok(sentenceCount >= 5 && sentenceCount <= 8);
  if (getDaewoonLifeStage(currentPeriod.ageRange).key !== "childhood") {
    assert.doesNotMatch(fallback.content, /아이|아기|양육|훈육|어린이집|놀이터/);
  }
}

const validContent = [
  "이 시기에는 아이가 스스로 선택하고 결과를 확인하려는 마음이 전보다 선명해질 수 있습니다. 새로운 관계나 활동 앞에서 먼저 나서다가도 기대만큼 되지 않으면 혼자 정리할 시간이 필요할 수 있습니다. 부모는 성과를 바로 평가하기보다 어떤 점이 즐거웠고 어려웠는지 차분히 물어봐 주세요.",
  "학교와 가정에서는 계획을 직접 세우고 작은 책임을 끝까지 맡는지 관찰해 볼 수 있습니다. 마음이 조급해질 때는 선택지를 두세 개로 줄이고 충분히 쉬게 하면 다시 자기 속도를 찾는 데 도움이 됩니다. 실제 반응은 환경과 경험에 따라 달라질 수 있으므로 매년 관심사와 회복 속도를 함께 기록해 주세요.",
].join("\n\n");
const parsed = parseDaewoonNarrative({ content: validContent });
assert.ok(parsed);
assert.equal(parsed.paragraphs.length, 2);
assert.equal(parsed.content, validContent);

const sharedReportResponse = parseDaewoonNarrative({
  sections: [{ id: "selected-daewoon", icon: "route", title: "성장 흐름", body: validContent }],
});
assert.ok(sharedReportResponse);
assert.equal(sharedReportResponse.content, validContent);

const sanitized = parseDaewoonNarrative({
  narrative: { body: validContent.replace("이 시기", "이 대운") },
});
assert.ok(sanitized);
assert.doesNotMatch(sanitized.content, /대운/);
assert.match(sanitized.content, /10년 단위 성장 흐름/);

const adultContent = validContent
  .replaceAll("아이", "성인 자녀")
  .replaceAll("부모", "가족")
  .replace("학교와 가정에서는", "직장과 일상에서는");
const parsedAdult = parseDaewoonNarrative({ content: adultContent }, [35, 44]);
assert.ok(parsedAdult);
assert.doesNotMatch(parsedAdult.content, /아이|아기|양육|훈육|어린이집|놀이터/);
assert.equal(getDaewoonLifeStage([35, 44]).subject, "성인 자녀");

assert.equal(parseDaewoonNarrative({ content: "짧은 해설입니다." }), null);
assert.equal(parseDaewoonNarrative({ unexpected: validContent }), null);

console.log("Daewoon AI verification passed.");
