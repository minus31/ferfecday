import knowledgeJson from "@/lib/saju/data/explanation-rules.json";
import type { LuckyDay } from "@/lib/lucky-day-types";

export type ExplanationTheme = keyof typeof knowledgeJson.themes;

export interface ExplanationRule {
  id: string;
  status: string;
  slot: string;
  category: string;
  title: string;
  trigger: string;
  basis: string;
  priority: number;
  mergePolicy: string;
  text: string;
  reviewStatus: string;
  sourceSheet: string;
  sourceOrder: number;
  matchPolicy: string;
  mappingNote: string;
  textSource: string;
}

export interface ExplanationRuleMatch extends ExplanationRule {
  theme: ExplanationTheme;
}

export interface ExplanationSearchOptions {
  theme?: ExplanationTheme;
  category?: string;
  limit?: number;
}

type RoleKey = "bigeop" | "siksang" | "jaeseong" | "gwanseong" | "insung";
type RoleLabel = "비겁" | "식상" | "재성" | "관성" | "인성";
type GidoLevel = "STRONG_OVER" | "SLIGHT_OVER" | "SLIGHT_UNDER" | "STRONG_UNDER" | "BALANCED";

const THEME_ENTRIES = Object.entries(knowledgeJson.themes) as Array<
  [ExplanationTheme, ExplanationRule[]]
>;

const ROLE_LABEL: Record<RoleKey, RoleLabel> = {
  bigeop: "비겁",
  siksang: "식상",
  jaeseong: "재성",
  gwanseong: "관성",
  insung: "인성",
};

const SIPSIN_KO: Record<string, string> = {
  本元: "비견", 比肩: "비견", 劫財: "겁재", 食神: "식신", 傷官: "상관",
  偏財: "편재", 正財: "정재", 偏官: "편관", 正官: "정관", 偏印: "편인", 正印: "정인",
};

const GYEOK_CODE: Record<string, string> = {
  正官: "JEONG_GWAN", 偏官: "PYEON_GWAN", 正印: "JEONG_IN", 偏印: "PYEON_IN",
  食神: "SIK_SIN", 傷官: "SANG_GWAN", 正財: "JEONG_JAE", 偏財: "PYEON_JAE",
  比肩: "GEON_ROK", 本元: "GEON_ROK", 劫財: "YANG_IN",
};

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

export function getExplanationRules(theme?: ExplanationTheme) {
  if (theme) return knowledgeJson.themes[theme] as ExplanationRule[];
  return THEME_ENTRIES.flatMap(([themeName, rules]) =>
    rules.map((rule) => ({ ...rule, theme: themeName })),
  );
}

/** 일주론 검색과 분리된 Excel/대운 요건 지식 검색기. */
export function searchExplanationKnowledge(
  query: string,
  options: ExplanationSearchOptions = {},
): ExplanationRuleMatch[] {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!terms.length) return [];
  const themes = options.theme
    ? ([[options.theme, knowledgeJson.themes[options.theme]]] as typeof THEME_ENTRIES)
    : THEME_ENTRIES;

  return themes
    .flatMap(([theme, rules]) =>
      (rules as ExplanationRule[]).map((rule) => ({ ...rule, theme })),
    )
    .filter((rule) => !options.category || rule.category === options.category)
    .map((rule) => {
      const title = normalizeSearchText(rule.title);
      const haystack = normalizeSearchText(
        [rule.id, rule.category, rule.title, rule.trigger, rule.basis, rule.text].join(" "),
      );
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      return {
        rule,
        score: matchedTerms.length * 10 + matchedTerms.filter((term) => title.includes(term)).length * 5,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.rule.priority - b.rule.priority || a.rule.sourceOrder - b.rule.sourceOrder)
    .slice(0, options.limit ?? 20)
    .map(({ rule }) => rule);
}

function getRoleState(day: LuckyDay) {
  const percentages = Object.fromEntries(
    (Object.keys(ROLE_LABEL) as RoleKey[]).map((role) => [role, day.strength.roleQi[role].percentage]),
  ) as Record<RoleKey, number>;
  const roles = Object.keys(percentages) as RoleKey[];
  const maxRole = roles.reduce((best, role) => percentages[role] > percentages[best] ? role : best);
  const minRole = roles.reduce((best, role) => percentages[role] < percentages[best] ? role : best);
  const max = percentages[maxRole];
  const min = percentages[minRole];
  let level: GidoLevel = "BALANCED";
  let primaryRole = maxRole;
  if (max > 45) level = "STRONG_OVER";
  else if (max > 30) level = "SLIGHT_OVER";
  else {
    primaryRole = minRole;
    if (min <= 5) level = "STRONG_UNDER";
    else if (min <= 10) level = "SLIGHT_UNDER";
  }
  return { percentages, maxRole, minRole, primaryRole, level };
}

function getSiCategory(day: LuckyDay) {
  if (day.strength.grade === "slightly-strong") return "SLIGHT_STRONG";
  if (day.strength.grade === "neutral") return "NEUTRAL";
  if (day.strength.grade === "extremely-strong") return "EXTREME_STRONG";
  if (day.strength.grade === "extremely-weak") return "EXTREME_WEAK";
  return "SLIGHT_WEAK";
}

function isOhaengGujok(day: LuckyDay) {
  return Object.values(day.elementQi.percentages).every((percentage) => percentage >= 5);
}

function getExactRule(theme: ExplanationTheme, id: string) {
  return (knowledgeJson.themes[theme] as ExplanationRule[]).find(
    (rule) => rule.status === "ACTIVE" && rule.id === id,
  );
}

function addMatch(
  matches: ExplanationRuleMatch[],
  theme: ExplanationTheme,
  rule: ExplanationRule | undefined,
) {
  if (rule && !matches.some((item) => item.id === rule.id)) matches.push({ ...rule, theme });
}

export interface MatchedExplanationKnowledge {
  context: {
    dayStem: string;
    dayBranch: string;
    siCategory: string;
    primaryRole: RoleLabel;
    primaryGidoLevel: GidoLevel;
    finalGyeokCode: string | null;
  };
  theme1: ExplanationRuleMatch[];
  theme2: ExplanationRuleMatch[];
  theme3: ExplanationRuleMatch[];
}

/** 현재 LuckyDay로 확실히 판정할 수 있는 규칙만 선택한다. */
export function matchExplanationKnowledge(day: LuckyDay): MatchedExplanationKnowledge {
  const theme1Name: ExplanationTheme = "Theme1_타고난그릇과기질_기본";
  const theme1SipsinName: ExplanationTheme = "Theme1_타고난그릇과기질_십성";
  const theme2Name: ExplanationTheme = "Theme2_성공과재능";
  const theme3Name: ExplanationTheme = "Theme3_양육솔루션";
  const dayPillar = day.pillars[1];
  const monthPillar = day.pillars[2];
  const role = getRoleState(day);
  const siCategory = getSiCategory(day);
  const primaryRole = ROLE_LABEL[role.primaryRole];
  const finalGyeokCode = GYEOK_CODE[monthPillar.branchSipsin] ?? null;
  const theme1: ExplanationRuleMatch[] = [];
  const theme2: ExplanationRuleMatch[] = [];
  const theme3: ExplanationRuleMatch[] = [];

  if (isOhaengGujok(day) && ["SLIGHT_STRONG", "NEUTRAL"].includes(siCategory)) {
    addMatch(theme1, theme1Name, getExactRule(theme1Name, `BASIC_BAL_${dayPillar.stem}_${siCategory}`));
  }
  if (role.level !== "BALANCED") {
    addMatch(theme1, theme1SipsinName, getExactRule(theme1SipsinName, `BASIC_${primaryRole}_${role.level}`));
    addMatch(theme2, theme2Name, getExactRule(theme2Name, `SIPSEONG_${primaryRole}_${role.level}`));
  }
  if (siCategory === "EXTREME_STRONG") {
    addMatch(theme1, theme1SipsinName, getExactRule(theme1SipsinName, "BASIC_EXTREME_STRONG_FALLBACK"));
  }

  if (finalGyeokCode) {
    addMatch(theme2, theme2Name, getExactRule(theme2Name, `GYEOK_${finalGyeokCode}`));
  }

  const unseongRules = (knowledgeJson.themes[theme2Name] as ExplanationRule[]).filter(
    (rule) => rule.status === "ACTIVE" && rule.category === "JOB_UNSEONG",
  );
  const genderName = day.gender === "F" ? "Female" : "Male";
  for (const ruleItem of unseongRules) {
    if (ruleItem.id.includes("JOB_BIZ_01")) {
      if (["편인", "정인"].includes(SIPSIN_KO[dayPillar.branchSipsin])) addMatch(theme2, theme2Name, ruleItem);
      continue;
    }
    if (ruleItem.id.includes("JOB_BIZ_02")) {
      if (["식신", "상관"].includes(SIPSIN_KO[dayPillar.branchSipsin])) addMatch(theme2, theme2Name, ruleItem);
      continue;
    }
    const stageMatch = ruleItem.trigger.match(/Ilji_12Unseong\s*==\s*'([^']+)'/);
    if (!stageMatch || !stageMatch[1].split("/").includes(dayPillar.unseong)) continue;
    if (ruleItem.trigger.includes("Gender") && !ruleItem.trigger.includes(genderName)) continue;
    addMatch(theme2, theme2Name, ruleItem);
  }

  const comboRules = (knowledgeJson.themes[theme3Name] as ExplanationRule[]).filter(
    (rule) => rule.status === "ACTIVE" && rule.category === "UNSEONG_SINSAL_COMBO",
  );
  for (const ruleItem of comboRules) {
    const unseongMatch = ruleItem.trigger.match(/Ilji_12Unseong\s*==\s*'([^']+)'/);
    const sinsalMatch = ruleItem.trigger.match(/Ilji_12Sinsal\s*==\s*'([^']+)'/);
    if (unseongMatch && !unseongMatch[1].split("/").includes(dayPillar.unseong)) continue;
    if (sinsalMatch && !sinsalMatch[1].split("/").includes(dayPillar.sinsal)) continue;
    if (ruleItem.trigger.includes("Gender") && !ruleItem.trigger.includes(genderName)) continue;
    if (unseongMatch || sinsalMatch) addMatch(theme3, theme3Name, ruleItem);
  }

  return {
    context: {
      dayStem: dayPillar.stem,
      dayBranch: dayPillar.branch,
      siCategory,
      primaryRole,
      primaryGidoLevel: role.level,
      finalGyeokCode,
    },
    theme1: theme1.sort((a, b) => a.priority - b.priority || a.sourceOrder - b.sourceOrder),
    theme2: theme2.sort((a, b) => a.priority - b.priority || a.sourceOrder - b.sourceOrder),
    theme3: theme3.sort((a, b) => a.priority - b.priority || a.sourceOrder - b.sourceOrder),
  };
}
