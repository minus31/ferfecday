import assert from "node:assert/strict";
import {
  calculateLuckyDays,
  diversifyRanking,
  formatBirthTimeWindow,
} from "../lib/lucky-days";

assert.equal(formatBirthTimeWindow(2, -32, "丑"), "01:32~03:32 축시");
assert.equal(formatBirthTimeWindow(0, -32, "子"), "전날 23:32~01:32 자시");
assert.equal(formatBirthTimeWindow(22, -32, "亥"), "21:32~23:32 해시");
const ranked = diversifyRanking([
  ...Array.from({ length: 8 }, (_, id) => ({ dayPillar: "甲子", id })),
  { dayPillar: "乙丑", id: 8 },
  { dayPillar: "丙寅", id: 9 },
]);
assert.equal(ranked[5].dayPillar, "乙丑");
assert.equal(new Set(ranked.map((item) => item.id)).size, 10);
assert.equal(
  diversifyRanking(Array.from({ length: 12 }, () => ({ dayPillar: "甲子" })))
    .length,
  10,
);
for (const location of ["서울", "부산", "제주"]) {
  const result = calculateLuckyDays({
    from: "2020-02-28",
    to: "2020-03-01",
    gender: "F",
    location,
  });
  assert.equal(result.results.length, 10);
  assert.equal(result.candidates, 36);
  assert.deepEqual(
    result.results.map((day) => day.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
}
assert.throws(() =>
  calculateLuckyDays({
    from: "2020-02-30",
    to: "2020-03-01",
    gender: "M",
    location: "서울",
  }),
);
console.log("Product ranking, past dates and corrected time windows: passed");
