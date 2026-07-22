import { STEM_INFO } from "@orrery/core/constants";
import type { SajuResult } from "@orrery/core/types";

import {
  ELEMENT_KEYS,
  GENERATES,
  getElementRole,
  type ElementQiBreakdown,
  type ElementQiKey,
  type ElementQiResult,
  type ElementRole,
} from "@/lib/saju/element-qi";
import type { StrengthIndexResult } from "@/lib/saju/strength-index";

export interface YongshinCandidate {
  stem: string;
  element: ElementQiKey;
  value: number;
  source: "stem" | "hidden-stem" | "fallback-heesin";
  position?: "year" | "month" | "day" | "time";
  branch?: string;
}

export interface YongshinResult {
  johuStatus: string;
  johuCollapsed: boolean;
  dominantElement: ElementQiKey | null;
  method: "johu" | "eokbu";
  role: ElementRole | "johu-control";
  element: ElementQiKey;
  elementLabel: string;
  representativeChar: string | null;
  representativeSource: YongshinCandidate["source"] | "daewoon-needed";
  candidates: YongshinCandidate[];
  fallbackElement: ElementQiKey | null;
  message: string;
}

const ELEMENT_HANJA: Record<ElementQiKey, string> = {
  tree: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

const POSITION_PRIORITY: Record<string, number> = {
  "hidden-stem:month": 0,
  "hidden-stem:day": 1,
  "hidden-stem:time": 2,
  "stem:month": 3,
  "stem:time": 4,
  "stem:year": 5,
  "hidden-stem:year": 6,
  "fallback-heesin:month": 7,
  "fallback-heesin:day": 8,
  "fallback-heesin:time": 9,
  "fallback-heesin:year": 10,
};

function getGeneratingElement(element: ElementQiKey) {
  return ELEMENT_KEYS.find((candidate) => GENERATES[candidate] === element) ?? null;
}

function getRoleCandidateRoles(si: number): ElementRole[] {
  return si >= 0 ? ["siksang", "jaeseong", "gwanseong"] : ["insung", "bigeop"];
}

function detectJohu(elementQi: ElementQiResult) {
  const fire = elementQi.percentages.fire;
  const water = elementQi.percentages.water;

  if ((fire > 0 && water === 0) || (water > 0 && fire === 0)) {
    const active = Math.max(fire, water);
    if (active >= 20) {
      const dominantElement = fire > 0 ? "fire" : "water";
      return {
        collapsed: true,
        dominantElement: dominantElement as ElementQiKey,
        status: dominantElement === "fire" ? "조열" : "한랭",
      };
    }
  }

  if (fire > 0 && water > 0) {
    const stronger = Math.max(fire, water);
    const weaker = Math.min(fire, water);
    if (stronger >= 20 && weaker / stronger <= 1 / 3) {
      const dominantElement = fire > water ? "fire" : "water";
      return {
        collapsed: true,
        dominantElement: dominantElement as ElementQiKey,
        status: dominantElement === "fire" ? "조열" : "한랭",
      };
    }
  }

  return {
    collapsed: false,
    dominantElement: null,
    status: "중화",
  };
}

function getPriority(candidate: YongshinCandidate) {
  return POSITION_PRIORITY[`${candidate.source}:${candidate.position}`] ?? 99;
}

function isYangStem(stem: string) {
  return STEM_INFO[stem]?.yinyang === "+";
}

function sortCandidates(a: YongshinCandidate, b: YongshinCandidate) {
  if (b.value !== a.value) return b.value - a.value;
  const priorityDiff = getPriority(a) - getPriority(b);
  if (priorityDiff !== 0) return priorityDiff;
  if (isYangStem(a.stem) !== isYangStem(b.stem)) return isYangStem(a.stem) ? -1 : 1;
  return a.stem.localeCompare(b.stem);
}

function getCandidates(
  breakdown: ElementQiBreakdown[],
  element: ElementQiKey,
  source: YongshinCandidate["source"] = "stem"
): YongshinCandidate[] {
  return breakdown
    .filter((item) => {
      if (!item.stem || item.element !== element) return false;
      return item.source === "stem" || item.source === "hidden-stem";
    })
    .map((item) => ({
      stem: item.stem as string,
      element,
      value: item.value,
      source: (source === "fallback-heesin" ? "fallback-heesin" : item.source) as YongshinCandidate["source"],
      position: item.position,
      branch: item.branch,
    }))
    .sort(sortCandidates);
}

export function calculateYongshin(
  result: SajuResult,
  elementQi: ElementQiResult,
  strength: StrengthIndexResult
): YongshinResult {
  const johu = detectJohu(elementQi);
  let method: YongshinResult["method"] = "eokbu";
  let role: YongshinResult["role"];
  let element: ElementQiKey;

  if (johu.collapsed && johu.dominantElement === "fire") {
    method = "johu";
    role = "johu-control";
    element = "water";
  } else if (johu.collapsed && johu.dominantElement === "water") {
    method = "johu";
    role = "johu-control";
    element = "fire";
  } else {
    const candidateRoles = getRoleCandidateRoles(strength.si);
    const selected = candidateRoles
      .map((candidateRole) => strength.roleQi[candidateRole])
      .sort((a, b) => b.percentage - a.percentage)[0];
    role = selected.role;
    element = selected.element;
  }

  let fallbackElement: ElementQiKey | null = null;
  let representativeSource: YongshinResult["representativeSource"] = "daewoon-needed";
  let candidates = getCandidates(elementQi.breakdown, element);

  if (candidates.length === 0) {
    fallbackElement = getGeneratingElement(element);
    candidates = fallbackElement
      ? getCandidates(elementQi.breakdown, fallbackElement, "fallback-heesin")
      : [];
  }

  const representative = candidates[0] ?? null;
  if (representative) representativeSource = representative.source;

  return {
    johuStatus: johu.status,
    johuCollapsed: johu.collapsed,
    dominantElement: johu.dominantElement,
    method,
    role,
    element,
    elementLabel: ELEMENT_HANJA[element],
    representativeChar: representative?.stem ?? null,
    representativeSource,
    candidates,
    fallbackElement,
    message: representative
      ? `${method === "johu" ? "조후" : "억부"} 기준 용신은 ${ELEMENT_HANJA[element]}이며 대표 글자는 ${representative.stem}입니다.`
      : `원국에 ${ELEMENT_HANJA[element]} 용신 글자가 없어 대운 유입에서 보완합니다.`,
  };
}
