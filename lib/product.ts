import type { LuckyDaysResponse } from "./lucky-day-types";
import type { FriendlyReportSection } from "./saju/integrated-report";

export const SUPPORT_EMAIL = "rouf____@naver.com";
export const REPORT_PRICE = 3900;
export const POLICY_VERSION = "2026-09-17";
export const REPORT_VERSION = "product-v4";
export const SECTION_TOPICS = [
  ["core", "sparkles", "타고난 기질과 삶의 바탕"],
  ["inner-pace", "heart", "마음의 속도와 자신감"],
  ["learning", "brain", "학업과 배움의 방식"],
  ["hidden-strength", "message", "함께 자라는 두 번째 재능"],
  ["relationships", "users", "친구와 협력하는 힘"],
  ["adult-relationships", "hand-heart", "연애, 결혼과 동반자 관계"],
  ["challenge", "shield", "강점이 부담이 되는 순간"],
  ["wellbeing", "activity", "몸과 마음의 생활 리듬"],
  ["career", "compass", "적성과 직업, 일하는 환경"],
  ["money", "wallet", "재물과 자원을 다루는 태도"],
  ["parenting", "home", "부모가 마련해 줄 성장 환경"],
  ["life-flow", "route", "생애의 변화와 기회를 쓰는 법"],
] as const;

export interface SearchInput {
  from: string;
  to: string;
  gender: "M" | "F";
  location: string;
}
export interface SavedSearch {
  id: string;
  userId: string;
  createdAt: string;
  input: SearchInput;
  result: LuckyDaysResponse;
}
export interface SearchView extends SavedSearch {
  unlocked: boolean;
}
export interface SearchHistoryItem {
  id: string;
  createdAt: string;
  input: SearchInput;
  location: string;
  count: number;
}
export interface PeriodReport {
  index: number;
  title: string;
  body: string;
}
export interface ReportBundle {
  sections: FriendlyReportSection[];
  periods: PeriodReport[];
  source: "ai" | "local";
  version: string;
}
export interface ReportView extends ReportBundle {
  unlocked: boolean;
  lockedSections: Array<{ id: string; title: string; icon: string }>;
}
export interface ImageResult {
  url: string | null;
  status: "ready" | "pending" | "unavailable";
}

/** 유료 본문은 숨기는 CSS와 무관하게 응답에서 제거한다. 대운은 요청대로 무료 공개한다. */
export function projectReport(
  bundle: ReportBundle,
  unlocked: boolean,
): ReportView {
  return {
    ...bundle,
    sections: unlocked ? bundle.sections : bundle.sections.slice(0, 1),
    unlocked,
    lockedSections: unlocked
      ? []
      : SECTION_TOPICS.slice(1).map(([id, icon, title]) => ({
          id,
          icon,
          title,
        })),
  };
}
