import assert from "node:assert/strict";

import { calculateLuckyDays } from "@/lib/lucky-days";
import {
  buildBabySummary,
  buildFriendlySajuSections,
  buildIntegratedSajuReport,
  buildSelectionReview,
  evaluateFriendlySajuSections,
  sanitizeSajuExplanation,
} from "@/lib/saju/integrated-report";
import { DAY_PILLARS, getDayPillarProfile } from "@/lib/saju/day-pillar-profiles";

assert.equal(
  sanitizeSajuExplanation("TR_DW_11(육해살 대운) — 내가 水를 쓴다."),
  "육해살 대운 — 아이가 수(水)를 쓴다.",
);
assert.equal(
  sanitizeSajuExplanation("힘이 나는 활동입니다. 나는 배우고 싶습니다."),
  "힘이 나는 활동입니다. 아이는 배우고 싶습니다.",
);
assert.equal(
  sanitizeSajuExplanation("30대에는 성인이 된 자녀가 선택을 주도합니다."),
  "30대에는 성인이 된 자녀가 선택을 주도합니다.",
);

const response = calculateLuckyDays({
  from: "2026-08-20",
  to: "2026-08-22",
  gender: "F",
  location: "서울",
});

assert.equal(response.candidates, 36);
assert.equal(response.results.length, 3);
const friendlyTitleSignatures = new Set<string>();

for (const day of response.results) {
  assert.match(day.timeLabel, /^\d{2}:00~\d{2}:00 [가-힣]+시$/);
  assert.ok(day.annualFortunes.length >= 100, "전체 대운 선택에 필요한 세운이 부족합니다.");
  const babySummary = buildBabySummary(day);
  assert.equal((babySummary.match(/[.!?](?:\s|$)/g) ?? []).length, 3, "아이 기질 요약은 3문장이어야 합니다.");
  assert.match(babySummary, /부모님께서 맞이할 아기/);
  const review = buildSelectionReview(day);
  assert.match(review.balance, /SI/);
  assert.match(review.balance, /대운 평균 기본점수/);
  assert.equal(review.temperament, babySummary);
  assert.ok(
    [...review.positiveItems, ...review.negativeItems].every((item) => !/^\d+장/.test(item.label)),
    "택일 총평의 가감점 항목에 내부 장 번호가 노출됩니다.",
  );
  const breakdown = day.scoring.breakdown;
  const expectedAdjustments = breakdown.elementBalanceAdjustment
    + breakdown.sipseongStructure
    + breakdown.unseongSinsal
    + breakdown.goodBadStars;
  assert.ok(Math.abs(expectedAdjustments - breakdown.adjustments) < 0.001);
  assert.ok(
    Math.abs(breakdown.daewoonAverageBaseScore + breakdown.adjustments - day.scoring.rawScore) < 0.011,
    "화면 점수 소계의 합이 원점수와 일치하지 않습니다.",
  );
  const friendlySections = buildFriendlySajuSections(day);
  friendlyTitleSignatures.add(friendlySections.map((section) => section.title).join("|"));
  assert.equal(friendlySections.length, 12, "화면용 해설은 12개 주제여야 합니다.");
  assert.equal(new Set(friendlySections.map((section) => section.id)).size, 12, "해설 주제 ID가 중복됩니다.");
  const friendlyEvaluation = evaluateFriendlySajuSections(friendlySections, day);
  assert.equal(friendlyEvaluation.accepted, true, friendlyEvaluation.issues.join("\n"));
  const friendlyText = friendlySections.map((section) => `${section.title}\n${section.body}`).join("\n");
  assert.match(friendlySections[0].body, /이 날짜를 선택한다면/);
  assert.match(friendlySections[0].body, /일간/);
  assert.match(friendlySections[0].body, /월지/);
  assert.match(friendlySections[0].body, /두 성향이 만나면/);
  const adultRelationship = friendlySections.find((section) => section.id === "adult-relationships");
  const wellbeing = friendlySections.find((section) => section.id === "wellbeing");
  assert.ok(adultRelationship);
  assert.match(adultRelationship.body, /성인/);
  assert.doesNotMatch(adultRelationship.body, /배우자(?:의)? (?:외모|직업|신분)|결혼.{0,12}(?:\d{4}년|나이|반드시)/);
  assert.ok(wellbeing);
  assert.match(wellbeing.body, /의료 전문가의 판단을 우선/);
  assert.doesNotMatch(wellbeing.body, /폐|기관지|대장|신장|방광|심장|혈관|생식기|천식|비염|당뇨|고혈압/);
  assert.doesNotMatch(friendlyText, /프로필에서는|자료에서는|AI(?:가|는|의)|보고서에서는|해설에서는/);
  assert.doesNotMatch(
    friendlyText,
    /\bSI\b|기도|용신|희신|일주론|격국|대운|십성|신강|신약|원국|생조|극설|TR_DW|GYEOK|SIPSEONG/i,
    "일반인용 해설에 전문·내부 용어가 남아 있습니다.",
  );
  assert.ok(friendlySections.every((section) => section.title.length >= 10 && section.body.length >= 240));
  assert.ok(friendlySections.every((section) => section.body.length <= 650), "모바일에서 읽기에는 해설 본문이 너무 깁니다.");
  assert.ok(friendlySections.every((section) => section.title.length <= 55), "모바일에서 읽기에는 해설 제목이 너무 깁니다.");

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

assert.ok(friendlyTitleSignatures.size > 1, "사주가 달라도 사용자용 해설 제목이 모두 같습니다.");

const templateDay = response.results[0];
for (const dayPillar of DAY_PILLARS) {
  const profile = getDayPillarProfile(dayPillar);
  assert.ok(profile, `${dayPillar} 프로필이 없습니다.`);
  const simulatedDay = {
    ...templateDay,
    dayPillar,
    dayPillarHangul: profile.name.replace("일주", ""),
  };
  const sections = buildFriendlySajuSections(simulatedDay);
  const evaluation = evaluateFriendlySajuSections(sections, simulatedDay);
  assert.equal(evaluation.accepted, true, `${dayPillar}: ${evaluation.issues.join("\n")}`);
  assert.ok(
    sections.every((section) => !section.title.includes(profile.image)),
    `${dayPillar} 물상 표현이 제목에 그대로 노출됩니다: ${profile.image}`,
  );
}

const strengthGrades = [
  "extremely-strong",
  "strong",
  "slightly-strong",
  "neutral",
  "slightly-weak",
  "weak",
  "extremely-weak",
] as const;
const primaryRoles = ["bigeop", "siksang", "jaeseong", "gwanseong", "insung"] as const;
for (const grade of strengthGrades) {
  for (const primaryRole of primaryRoles) {
    const roleQi = {
      ...templateDay.strength.roleQi,
      bigeop: { ...templateDay.strength.roleQi.bigeop, percentage: primaryRole === "bigeop" ? 60 : 10 },
      siksang: { ...templateDay.strength.roleQi.siksang, percentage: primaryRole === "siksang" ? 60 : 10 },
      jaeseong: { ...templateDay.strength.roleQi.jaeseong, percentage: primaryRole === "jaeseong" ? 60 : 10 },
      gwanseong: { ...templateDay.strength.roleQi.gwanseong, percentage: primaryRole === "gwanseong" ? 60 : 10 },
      insung: { ...templateDay.strength.roleQi.insung, percentage: primaryRole === "insung" ? 60 : 10 },
    };
    const simulatedDay = {
      ...templateDay,
      strength: { ...templateDay.strength, grade, roleQi },
    };
    const sections = buildFriendlySajuSections(simulatedDay);
    const evaluation = evaluateFriendlySajuSections(sections, simulatedDay);
    assert.equal(evaluation.accepted, true, `${grade}/${primaryRole}: ${evaluation.issues.join("\n")}`);
  }
}

const rejectedShortMetaphor = evaluateFriendlySajuSections([
  {
    id: "core",
    icon: "sparkles",
    title: "건조한 땅을 잇는 구불구불한 길",
    body: "근면한 아이입니다.",
  },
], templateDay);
assert.equal(rejectedShortMetaphor.accepted, false, "추상적인 물상 제목과 짧은 본문을 거부해야 합니다.");
assert.ok(rejectedShortMetaphor.issues.some((issue) => issue.includes("자연물 비유")));
assert.ok(rejectedShortMetaphor.issues.some((issue) => issue.includes("240~650자")));

const rejectedProviderMeta = evaluateFriendlySajuSections(buildFriendlySajuSections(templateDay).map(
  (section, index) => index === 0 ? { ...section, body: section.body.replace("이 날짜를 선택한다면", "프로필에서는") } : section,
), templateDay);
assert.equal(rejectedProviderMeta.accepted, false, "제작 과정 관점의 메타 표현을 거부해야 합니다.");
assert.ok(rejectedProviderMeta.issues.some((issue) => issue.includes("메타 표현")));

const rejectedHealthPrediction = evaluateFriendlySajuSections(buildFriendlySajuSections(templateDay).map(
  (section) => section.id === "wellbeing"
    ? { ...section, body: section.body.replace("활동과 회복의 리듬", "폐와 기관지의 취약성") }
    : section,
), templateDay);
assert.equal(rejectedHealthPrediction.accepted, false, "사주로 특정 장기 취약성을 예측한 해설을 거부해야 합니다.");
assert.ok(rejectedHealthPrediction.issues.some((issue) => issue.includes("장기나 질환")));

const rejectedPartnerPrediction = evaluateFriendlySajuSections(buildFriendlySajuSections(templateDay).map(
  (section) => section.id === "adult-relationships"
    ? { ...section, body: section.body.replace("상대의 모습", "배우자의 외모") }
    : section,
), templateDay);
assert.equal(rejectedPartnerPrediction.accepted, false, "배우자의 외모를 예언한 해설을 거부해야 합니다.");
assert.ok(rejectedPartnerPrediction.issues.some((issue) => issue.includes("배우자 모습")));

console.log("detail-report verification: ok");
