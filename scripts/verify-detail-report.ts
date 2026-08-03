import assert from "node:assert/strict";

import { calculateLuckyDays } from "@/lib/lucky-days";
import { buildBabySummary, buildIntegratedSajuReport, sanitizeSajuExplanation } from "@/lib/saju/integrated-report";

assert.equal(
  sanitizeSajuExplanation("TR_DW_11(육해살 대운) — 내가 水를 쓴다."),
  "육해살 대운 — 아이가 수(水)를 쓴다.",
);

const response = calculateLuckyDays({
  from: "2026-08-20",
  to: "2026-08-22",
  gender: "F",
  location: "서울",
});

assert.equal(response.candidates, 36);
assert.equal(response.results.length, 3);

for (const day of response.results) {
  assert.match(day.timeLabel, /^\d{2}:00~\d{2}:00 [가-힣]+시$/);
  assert.ok(day.annualFortunes.length >= 100, "전체 대운 선택에 필요한 세운이 부족합니다.");
  const babySummary = buildBabySummary(day);
  assert.equal((babySummary.match(/[.!?](?:\s|$)/g) ?? []).length, 3, "아이 기질 요약은 3문장이어야 합니다.");
  assert.match(babySummary, /부모님께서 맞이할 아기/);

  const report = buildIntegratedSajuReport(day);
  const userText = Object.values(report.content).join("\n");
  assert.doesNotMatch(userText, /TR_DW_\d+/);
  assert.match(report.content.overview, /부모님|아기|아이/);
  assert.match(report.content.overview, /육아 팁/);
  assert.ok(report.daewoon.every((item) => !item.sinsalTitle || !item.sinsalTitle.includes("TR_DW")));
  for (const match of userText.matchAll(/[\u3400-\u9fff]+/g)) {
    const start = match.index;
    const end = start + match[0].length;
    const context = userText.slice(Math.max(0, start - 20), Math.min(userText.length, end + 20));
    const openParen = userText.lastIndexOf("(", start);
    const closeParen = userText.lastIndexOf(")", start);
    assert.ok(openParen > closeParen, `한글 독음이 병기되지 않은 한자: ${context}`);
    assert.match(userText.slice(Math.max(0, openParen - 4), openParen), /[가-힣]$/, `한자 앞 한글 독음 누락: ${context}`);
  }

  day.daewoon.forEach((daewoon, index) => {
    const next = day.daewoon[index + 1];
    const startYear = Number(day.date.slice(0, 4)) + daewoon.age - 1;
    const endYear = next ? Number(day.date.slice(0, 4)) + next.age - 2 : startYear + 9;
    const annuals = day.annualFortunes.filter((item) => item.year >= startYear && item.year <= endYear);
    assert.equal(annuals.length, endYear - startYear + 1, `${daewoon.index}대운 세운 범위 오류`);
  });

  if (day.yongshin.johuCollapsed) {
    assert.equal(day.yongshin.method, "johu");
    assert.equal(
      day.yongshin.element,
      day.yongshin.dominantElement === "fire" ? "water" : "fire",
    );
  } else {
    assert.equal(day.yongshin.method, "eokbu");
    const allowedRoles = day.strength.si >= 0
      ? ["siksang", "jaeseong", "gwanseong"]
      : ["insung", "bigeop"];
    assert.ok(allowedRoles.includes(day.yongshin.role));
  }

  if (day.yongshin.representativeSource === "fallback-heesin") {
    assert.match(day.yongshin.message, /희신/);
  }
}

console.log("detail-report verification: ok");
