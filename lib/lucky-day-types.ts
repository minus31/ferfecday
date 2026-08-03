export interface LuckyPillar {
  name: string;
  ganzi: string;
  ganziHangul: string;
  stem: string;
  branch: string;
  stemSipsin: string;
  branchSipsin: string;
  unseong: string;
  sinsal: string;
  jigang: string;
}

export interface LuckyDaewoon {
  index: number;
  ganzi: string;
  ganziHangul: string;
  age: number;
  startDate: string;
  stemSipsin: string;
  branchSipsin: string;
  unseong: string;
  sinsal: string;
  isGongmang: boolean;
}

export interface LuckyAnnualFortune {
  year: number;
  ganzi: string;
  ganziHangul: string;
  stemSipsin: string;
  branchSipsin: string;
  unseong: string;
  sinsal: string;
}

export interface LuckyRelationPair {
  key: string;
  stem: Array<{ type: string; detail: string | null }>;
  branch: Array<{ type: string; detail: string | null }>;
}

export interface LuckyScoreDetail {
  label: string;
  value: number;
  description: string;
}

export interface LuckyElementQi {
  totals: Record<"tree" | "fire" | "earth" | "metal" | "water", number>;
  percentages: Record<"tree" | "fire" | "earth" | "metal" | "water", number>;
  missing: Array<"tree" | "fire" | "earth" | "metal" | "water">;
  total: number;
}

type LuckyElementKey = "tree" | "fire" | "earth" | "metal" | "water";
type LuckyElementRole = "bigeop" | "insung" | "siksang" | "jaeseong" | "gwanseong";

export interface LuckyStrengthIndex {
  dayMasterElement: LuckyElementKey;
  roleQi: Record<
    LuckyElementRole,
    {
      role: LuckyElementRole;
      element: LuckyElementKey;
      total: number;
      percentage: number;
    }
  >;
  supportQi: number;
  drainControlQi: number;
  si: number;
  grade:
    | "slightly-strong"
    | "neutral"
    | "slightly-weak"
    | "extremely-strong"
    | "extremely-weak";
  gradeLabel: string;
  k: number;
  baseScore: number;
  targetScoreRange: [number, number];
  description: string;
}

export interface LuckyYongshinCandidate {
  stem: string;
  element: LuckyElementKey;
  value: number;
  source: "stem" | "hidden-stem" | "fallback-heesin";
  position?: "year" | "month" | "day" | "time";
  branch?: string;
}

export interface LuckyYongshin {
  johuStatus: string;
  johuCollapsed: boolean;
  dominantElement: LuckyElementKey | null;
  method: "johu" | "eokbu";
  role: LuckyElementRole | "johu-control";
  element: LuckyElementKey;
  elementLabel: string;
  representativeChar: string | null;
  representativeSource: "stem" | "hidden-stem" | "fallback-heesin" | "daewoon-needed";
  candidates: LuckyYongshinCandidate[];
  fallbackElement: LuckyElementKey | null;
  message: string;
}

export interface LuckyDay {
  id: string;
  rank: number;
  date: string;
  hour: number;
  minute: number;
  timeLabel: string;
  gender: "M" | "F";
  location: {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    input?: string;
    matched: boolean;
  };
  timeCorrection: {
    standardLongitude: number;
    correctionMinutes: number;
    adjustedDate: string;
    adjustedHour: number;
    adjustedMinute: number;
    calculationBasis: "corrected-solar-time";
  };
  score: number;
  dayPillar: string;
  dayPillarHangul: string;
  pillars: LuckyPillar[];
  daewoon: LuckyDaewoon[];
  annualFortunes: LuckyAnnualFortune[];
  relations: {
    pairs: LuckyRelationPair[];
    triple: Array<{ type: string; detail: string | null }>;
    directional: Array<{ type: string; detail: string | null }>;
  };
  specialSals: {
    yangin: number[];
    baekho: boolean;
    goegang: boolean;
    dohwa: number[];
    cheonul: number[];
    cheonduk: number[];
    wolduk: number[];
    munchang: number[];
    hongyeom: boolean;
    geumyeo: number[];
  };
  gongmang: {
    branches: [string, string];
    pillarIndices: number[];
  };
  elementQi: LuckyElementQi;
  strength: LuckyStrengthIndex;
  yongshin: LuckyYongshin;
  jwabeop: Array<Array<{ stem: string; sipsin: string; unseong: string }>>;
  injongbeop: Array<{ category: string; yangStem: string; unseong: string }>;
  scoring: {
    rawScore: number;
    capped: boolean;
    details: LuckyScoreDetail[];
    daewoonScores: Array<{
      index: number;
      ganzi: string;
      si: number;
      gradeLabel: string;
      k: number;
      baseScore: number;
    }>;
  };
}

export interface LuckyDaysResponse {
  from: string;
  to: string;
  gender: "M" | "F";
  location: {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    input?: string;
    matched: boolean;
  };
  candidates: number;
  results: LuckyDay[];
}
