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

export interface LuckyDay {
  id: string;
  rank: number;
  date: string;
  hour: number;
  minute: number;
  timeLabel: string;
  score: number;
  dayPillar: string;
  dayPillarHangul: string;
  pillars: LuckyPillar[];
  daewoon: LuckyDaewoon[];
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
  jwabeop: Array<Array<{ stem: string; sipsin: string; unseong: string }>>;
  injongbeop: Array<{ category: string; yangStem: string; unseong: string }>;
  scoring: {
    details: LuckyScoreDetail[];
  };
}

export interface LuckyDaysResponse {
  from: string;
  to: string;
  candidates: number;
  results: LuckyDay[];
}
