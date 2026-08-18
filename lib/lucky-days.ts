import { calculateSaju } from "@orrery/core/saju";
import {
  getJeonggi,
  getRelation,
  getTwelveMeteor,
  getTwelveSpirit,
  getYearGanzi,
} from "@orrery/core/pillars";
import type { SajuResult } from "@orrery/core/types";

import {
  adjustBirthTimeByLongitude,
  getBirthLocation,
  parseBirthGender,
  STANDARD_MERIDIAN_LONGITUDE,
  type BirthGender,
  type BirthLocation,
} from "@/lib/birth-options";
import type { LuckyDay, LuckyDaysResponse, LuckyScoreDetail } from "@/lib/lucky-day-types";
import { calculateBaseScoring } from "@/lib/saju/base-score";
import { calculateElementQi } from "@/lib/saju/element-qi";
import { calculateStrengthIndex } from "@/lib/saju/strength-index";
import { calculateYongshin } from "@/lib/saju/yongshin";

export const MAX_RANGE_DAYS = 3;

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
  { hour: 0, label: "00:00~02:00 자시" },
  { hour: 2, label: "02:00~04:00 축시" },
  { hour: 4, label: "04:00~06:00 인시" },
  { hour: 6, label: "06:00~08:00 묘시" },
  { hour: 8, label: "08:00~10:00 진시" },
  { hour: 10, label: "10:00~12:00 사시" },
  { hour: 12, label: "12:00~14:00 오시" },
  { hour: 14, label: "14:00~16:00 미시" },
  { hour: 16, label: "16:00~18:00 신시" },
  { hour: 18, label: "18:00~20:00 유시" },
  { hour: 20, label: "20:00~22:00 술시" },
  { hour: 22, label: "22:00~24:00 해시" },
];

// @orrery/core 0.4.2는 시진 경계를 01:30, 03:30, ...으로 고정한다.
// 앱은 출생지 경도로 보정한 태양시를 사용하므로, 표준 시진 경계
// 01:00, 03:00, ...과 일치시키기 위해 엔진 입력에만 30분을 더한다.
const ORRERY_FIXED_HOUR_BOUNDARY_OFFSET_MINUTES = 30;

function adaptCorrectedTimeForOrrery(adjusted: ReturnType<typeof adjustBirthTimeByLongitude>) {
  const engineTime = new Date(Date.UTC(
    adjusted.year,
    adjusted.month - 1,
    adjusted.day,
    adjusted.hour,
    adjusted.minute + ORRERY_FIXED_HOUR_BOUNDARY_OFFSET_MINUTES,
  ));

  return {
    year: engineTime.getUTCFullYear(),
    month: engineTime.getUTCMonth() + 1,
    day: engineTime.getUTCDate(),
    hour: engineTime.getUTCHours(),
    minute: engineTime.getUTCMinutes(),
  };
}

interface ParsedDate {
  year: number;
  month: number;
  day: number;
  utc: number;
}

export function parseDateParam(value: string | null): ParsedDate | null {
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

function ganziToHangul(ganzi: string) {
  return [...ganzi].map((char) => STEM_HANGUL[char] ?? BRANCH_HANGUL[char] ?? char).join("");
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

function serializeLocation(location: BirthLocation): LuckyDay["location"] {
  return {
    id: location.id,
    label: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    input: location.input,
    matched: location.matched,
  };
}

function scoreSaju(result: SajuResult) {
  const elementQi = calculateElementQi(result);
  const strength = calculateStrengthIndex(result, elementQi);
  const yongshin = calculateYongshin(result, elementQi, strength);
  const baseScoring = calculateBaseScoring(
    result,
    elementQi,
    strength,
    yongshin,
    result.input.gender
  );
  const elementQiValues = [
    elementQi.percentages.tree,
    elementQi.percentages.fire,
    elementQi.percentages.earth,
    elementQi.percentages.metal,
    elementQi.percentages.water,
  ];
  const missingElements = elementQi.missing.length;

  const details: LuckyScoreDetail[] = [
    ...baseScoring.details,
    {
      label: "7장 오행 기도",
      value: 0,
      description: `목화토금수 기도 ${elementQiValues
        .map((value) => `${value.toFixed(1)}%`)
        .join("/")}, 결핍 ${missingElements}개`,
    },
    {
      label: "9장 용신",
      value: 0,
      description: yongshin.message,
    },
  ];

  return {
    score: baseScoring.score,
    rawScore: baseScoring.rawScore,
    details,
    daewoonBaseScores: baseScoring.daewoonBaseScores,
    elementQi: {
      totals: elementQi.totals,
      percentages: elementQi.percentages,
      missing: elementQi.missing,
      total: elementQi.total,
    },
    strength,
    yongshin,
  };
}

function serializeCandidate(
  result: SajuResult,
  rank: number,
  date: string,
  hour: number,
  timeLabel: string,
  gender: BirthGender,
  location: BirthLocation,
  timeCorrection: LuckyDay["timeCorrection"]
): LuckyDay {
  const scoring = scoreSaju(result);
  const dayPillar = result.pillars[1].pillar.ganzi;
  const dayStem = result.pillars[1].pillar.stem;
  const yearBranch = result.pillars[3].pillar.branch;
  const birthYear = Number(date.slice(0, 4));

  return {
    id: `${date}-${String(hour).padStart(2, "0")}`,
    rank,
    date,
    hour,
    minute: 0,
    timeLabel,
    gender,
    location: serializeLocation(location),
    timeCorrection,
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
    annualFortunes: Array.from({
      length: Math.max(10, (result.daewoon.at(-1)?.age ?? 91) + 9),
    }, (_, index) => {
      const year = birthYear + index;
      const ganzi = getYearGanzi(year);
      const [stem, branch] = [...ganzi];

      return {
        year,
        ganzi,
        ganziHangul: ganziToHangul(ganzi),
        stemSipsin: getRelation(dayStem, stem)?.hanja ?? "?",
        branchSipsin: getRelation(dayStem, getJeonggi(branch))?.hanja ?? "?",
        unseong: getTwelveMeteor(dayStem, branch),
        sinsal: getTwelveSpirit(yearBranch, branch),
      };
    }),
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
    strength: scoring.strength,
    yongshin: scoring.yongshin,
    jwabeop: result.jwabeop,
    injongbeop: result.injongbeop,
    scoring: {
      rawScore: scoring.rawScore,
      capped: scoring.rawScore > 100,
      details: scoring.details,
      daewoonScores: scoring.daewoonBaseScores,
    },
  };
}

export function calculateLuckyDays({
  from,
  to,
  gender: genderInput,
  location: locationInput,
}: {
  from: string | null;
  to: string | null;
  gender: string | null;
  location: string | null;
}): LuckyDaysResponse {
  const parsedFrom = parseDateParam(from);
  const parsedTo = parseDateParam(to);
  const gender = parseBirthGender(genderInput);
  const location = getBirthLocation(locationInput);

  if (!parsedFrom || !parsedTo || parsedFrom.utc > parsedTo.utc) {
    throw new Error("날짜 범위를 다시 선택해주세요.");
  }

  const rangeDays = Math.floor((parsedTo.utc - parsedFrom.utc) / (24 * 60 * 60 * 1000)) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw new Error(`날짜 범위는 최대 ${MAX_RANGE_DAYS}일까지 선택할 수 있습니다.`);
  }

  const candidates = getDatesInclusive(parsedFrom.utc, parsedTo.utc).flatMap((date) =>
    HOUR_SLOTS.map((slot) => {
      const adjusted = adjustBirthTimeByLongitude({
        year: date.year,
        month: date.month,
        day: date.day,
        hour: slot.hour,
        minute: 0,
        longitude: location.longitude,
        correctionMinutes: location.correctionMinutes,
      });
      const engineTime = adaptCorrectedTimeForOrrery(adjusted);
      const result = calculateSaju({
        year: engineTime.year,
        month: engineTime.month,
        day: engineTime.day,
        hour: engineTime.hour,
        minute: engineTime.minute,
        gender,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      return serializeCandidate(result, 0, date.date, slot.hour, slot.label, gender, location, {
        standardLongitude: STANDARD_MERIDIAN_LONGITUDE,
        correctionMinutes: adjusted.correctionMinutes,
        adjustedDate: formatDateUTC(Date.UTC(adjusted.year, adjusted.month - 1, adjusted.day)),
        adjustedHour: adjusted.hour,
        adjustedMinute: adjusted.minute,
        calculationBasis: "corrected-solar-time",
      });
    })
  );

  const results = candidates
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.scoring.rawScore - a.scoring.rawScore ||
        a.date.localeCompare(b.date) ||
        a.hour - b.hour
    )
    .slice(0, 3)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));

  return {
    from: from ?? "",
    to: to ?? "",
    gender,
    location: serializeLocation(location),
    candidates: candidates.length,
    results,
  };
}
