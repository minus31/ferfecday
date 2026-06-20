import { NextResponse } from "next/server";
import { calculateSaju } from "@orrery/core/saju";
import type { SajuResult } from "@orrery/core/types";

import type { LuckyDay, LuckyScoreDetail } from "@/lib/lucky-day-types";
import { calculateElementQi } from "@/lib/saju/element-qi";

const MAX_RANGE_DAYS = 14;
const PILLAR_NAMES = ["시주", "일주", "월주", "년주"];
const STEM_HANGUL: Record<string, string> = {
  "甲": "갑",
  "乙": "을",
  "丙": "병",
  "丁": "정",
  "戊": "무",
  "己": "기",
  "庚": "경",
  "辛": "신",
  "壬": "임",
  "癸": "계",
};
const BRANCH_HANGUL: Record<string, string> = {
  "子": "자",
  "丑": "축",
  "寅": "인",
  "卯": "묘",
  "辰": "진",
  "巳": "사",
  "午": "오",
  "未": "미",
  "申": "신",
  "酉": "유",
  "戌": "술",
  "亥": "해",
};
const HOUR_SLOTS = [
  { hour: 0, label: "00:00 자시" },
  { hour: 2, label: "02:00 축시" },
  { hour: 4, label: "04:00 인시" },
  { hour: 6, label: "06:00 묘시" },
  { hour: 8, label: "08:00 진시" },
  { hour: 10, label: "10:00 사시" },
  { hour: 12, label: "12:00 오시" },
  { hour: 14, label: "14:00 미시" },
  { hour: 16, label: "16:00 신시" },
  { hour: 18, label: "18:00 유시" },
  { hour: 20, label: "20:00 술시" },
  { hour: 22, label: "22:00 해시" },
];

const GOOD_RELATIONS = new Set(["合", "六合", "三合", "方合"]);
const BAD_RELATIONS = new Set(["沖", "刑", "破", "害", "怨嗔", "鬼門"]);
const GOOD_UNSEONG = new Set(["長生", "冠帶", "建祿", "帝旺", "養"]);
const WEAK_UNSEONG = new Set(["死", "墓", "絶"]);
const GOOD_SINSAL = new Set(["將星", "攀鞍", "驛馬"]);

function ganziToHangul(ganzi: string) {
  return [...ganzi].map((char) => STEM_HANGUL[char] ?? BRANCH_HANGUL[char] ?? char).join("");
}

function parseDateParam(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, utc };
}

function formatDateUTC(utc: number) {
  const date = new Date(utc);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDatesInclusive(fromUtc: number, toUtc: number) {
  const dates: Array<{ year: number; month: number; day: number; date: string }> = [];

  for (let utc = fromUtc; utc <= toUtc; utc += 24 * 60 * 60 * 1000) {
    const date = new Date(utc);
    dates.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      date: formatDateUTC(utc),
    });
  }

  return dates;
}

function scoreSaju(result: SajuResult) {
  const details: LuckyScoreDetail[] = [];
  let score = 55;

  const elementQi = calculateElementQi(result);
  const elementQiValues = [
    elementQi.percentages.tree,
    elementQi.percentages.fire,
    elementQi.percentages.earth,
    elementQi.percentages.metal,
    elementQi.percentages.water,
  ];
  const balancePenalty = elementQiValues.reduce(
    (sum, percentage) => sum + Math.abs(percentage - 20),
    0
  );
  const balanceBonus = Math.round(Math.max(0, 22 - balancePenalty * 0.32));
  const missingElements = elementQi.missing.length;

  score += balanceBonus;
  score -= missingElements * 5;
  details.push({
    label: "오행 균형",
    value: balanceBonus - missingElements * 5,
    description: `목화토금수 기도 ${elementQiValues
      .map((value) => `${value.toFixed(1)}%`)
      .join("/")}`,
  });

  const allPairRelations = [...result.relations.pairs.values()].flatMap((pair) => [
    ...pair.stem,
    ...pair.branch,
  ]);
  const goodRelationCount =
    allPairRelations.filter((relation) => GOOD_RELATIONS.has(relation.type)).length +
    result.relations.triple.length +
    result.relations.directional.length;
  const badRelationCount = allPairRelations.filter((relation) =>
    BAD_RELATIONS.has(relation.type)
  ).length;
  const relationValue = goodRelationCount * 3 - badRelationCount * 4;

  score += relationValue;
  details.push({
    label: "간지 관계",
    value: relationValue,
    description: `좋은 관계 ${goodRelationCount}개, 충/형/파/해 계열 ${badRelationCount}개`,
  });

  const unseongValue = result.pillars.reduce((sum, detail) => {
    if (GOOD_UNSEONG.has(detail.unseong)) return sum + 3;
    if (WEAK_UNSEONG.has(detail.unseong)) return sum - 2;
    return sum;
  }, 0);
  score += unseongValue;
  details.push({
    label: "12운성",
    value: unseongValue,
    description: result.pillars.map((detail) => detail.unseong).join(", "),
  });

  const sinsalValue =
    result.specialSals.cheonul.length * 5 +
    result.specialSals.cheonduk.length * 4 +
    result.specialSals.wolduk.length * 4 +
    result.specialSals.munchang.length * 3 +
    result.specialSals.geumyeo.length * 2 +
    result.pillars.filter((detail) => GOOD_SINSAL.has(detail.sinsal)).length * 2 -
    (result.specialSals.baekho ? 5 : 0) -
    (result.specialSals.goegang ? 3 : 0);
  score += sinsalValue;
  details.push({
    label: "길성/신살",
    value: sinsalValue,
    description: "천을/천덕/월덕/문창/금여는 가점, 백호/괴강은 감점",
  });

  const sipsinCount = new Set(
    result.pillars.flatMap((detail) => [detail.stemSipsin, detail.branchSipsin])
  ).size;
  const sipsinValue = Math.min(8, sipsinCount);
  score += sipsinValue;
  details.push({
    label: "십성 다양성",
    value: sipsinValue,
    description: `${sipsinCount}종류의 십성이 나타남`,
  });

  const gongmangValue = -result.gongmang.pillarIndices.length * 4;
  score += gongmangValue;
  details.push({
    label: "공망",
    value: gongmangValue,
    description:
      result.gongmang.pillarIndices.length > 0
        ? `${result.gongmang.pillarIndices.length}개 주가 공망에 해당`
        : "공망 해당 주 없음",
  });

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    details,
    elementQi: {
      totals: elementQi.totals,
      percentages: elementQi.percentages,
      missing: elementQi.missing,
      total: elementQi.total,
    },
  };
}

function serializeCandidate(
  result: SajuResult,
  rank: number,
  date: string,
  hour: number,
  timeLabel: string
): LuckyDay {
  const scoring = scoreSaju(result);
  const dayPillar = result.pillars[1].pillar.ganzi;

  return {
    id: `${date}-${String(hour).padStart(2, "0")}`,
    rank,
    date,
    hour,
    minute: 0,
    timeLabel,
    score: scoring.score,
    dayPillar,
    dayPillarHangul: ganziToHangul(dayPillar),
    pillars: result.pillars.map((detail, index) => ({
      name: PILLAR_NAMES[index],
      ganzi: detail.pillar.ganzi,
      ganziHangul: ganziToHangul(detail.pillar.ganzi),
      stem: detail.pillar.stem,
      branch: detail.pillar.branch,
      stemSipsin: detail.stemSipsin,
      branchSipsin: detail.branchSipsin,
      unseong: detail.unseong,
      sinsal: detail.sinsal,
      jigang: detail.jigang,
    })),
    daewoon: result.daewoon.slice(0, 10).map((item) => ({
      index: item.index,
      ganzi: item.ganzi,
      ganziHangul: ganziToHangul(item.ganzi),
      age: item.age,
      startDate: item.startDate.toISOString(),
      stemSipsin: item.stemSipsin,
      branchSipsin: item.branchSipsin,
      unseong: item.unseong,
      sinsal: item.sinsal,
      isGongmang: item.isGongmang,
    })),
    relations: {
      pairs: [...result.relations.pairs.entries()].map(([key, pair]) => ({
        key,
        stem: pair.stem,
        branch: pair.branch,
      })),
      triple: result.relations.triple,
      directional: result.relations.directional,
    },
    specialSals: result.specialSals,
    gongmang: result.gongmang,
    elementQi: scoring.elementQi,
    jwabeop: result.jwabeop,
    injongbeop: result.injongbeop,
    scoring: {
      details: scoring.details,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = parseDateParam(searchParams.get("from"));
  const to = parseDateParam(searchParams.get("to"));

  if (!from || !to || from.utc > to.utc) {
    return NextResponse.json(
      { error: "from/to query params must be valid yyyy-MM-dd dates." },
      { status: 400 }
    );
  }

  const rangeDays = Math.floor((to.utc - from.utc) / (24 * 60 * 60 * 1000)) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Date range must be ${MAX_RANGE_DAYS} days or less.` },
      { status: 400 }
    );
  }

  const candidates = getDatesInclusive(from.utc, to.utc).flatMap((date) =>
    HOUR_SLOTS.map((slot) => {
      const result = calculateSaju({
        year: date.year,
        month: date.month,
        day: date.day,
        hour: slot.hour,
        minute: 0,
        gender: "M",
      });

      return serializeCandidate(result, 0, date.date, slot.hour, slot.label);
    })
  );

  const results = candidates
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date) || a.hour - b.hour)
    .slice(0, 10)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));

  return NextResponse.json({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    candidates: candidates.length,
    results,
  });
}
