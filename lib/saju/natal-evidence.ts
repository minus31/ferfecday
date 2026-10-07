import { BRANCH_ELEMENT, STEM_INFO } from "@orrery/core/constants";
import { getJeonggi, getRelation, toHangul } from "@orrery/core/pillars";
import type { LuckyDay } from "../lucky-day-types";
import { CONTROLS, GENERATES, type ElementQiKey } from "./element-qi";

export const ELEMENT_NAMES: Record<ElementQiKey, string> = {
  tree: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

export function subjectParticle(word: string) {
  const last = word.codePointAt(word.length - 1) ?? 0;
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0
    ? "이"
    : "가";
}

export function readableCharacter(char: string) {
  return `${toHangul(char)}(${char})`;
}

export const TEN_GOD_GROUPS = [
  { name: "비겁", gods: ["비견", "겁재"] },
  { name: "식상", gods: ["식신", "상관"] },
  { name: "재성", gods: ["정재", "편재"] },
  { name: "관성", gods: ["정관", "편관"] },
  { name: "인성", gods: ["정인", "편인"] },
] as const;

const GOD_NAMES: Record<string, string> = {
  本元: "비견",
  比肩: "비견",
  劫財: "겁재",
  食神: "식신",
  傷官: "상관",
  正財: "정재",
  偏財: "편재",
  正官: "정관",
  偏官: "편관",
  正印: "정인",
  偏印: "편인",
};
const RELATION_NAMES: Record<string, string> = {
  合: "합",
  沖: "충",
  刑: "형",
  破: "파",
  害: "해",
  鬼門: "귀문",
  怨嗔: "원진",
};

export type TenGodEvidence = {
  name: string;
  visible: string[];
  hidden: string[];
};

export function getCharacterElement(char: string): ElementQiKey | null {
  return STEM_INFO[char]?.element ?? BRANCH_ELEMENT[char] ?? null;
}

export function getTenGodEvidence(day: LuckyDay) {
  const evidence = new Map<string, TenGodEvidence>();
  for (const group of TEN_GOD_GROUPS)
    for (const name of group.gods)
      evidence.set(name, { name, visible: [], hidden: [] });
  for (const [index, pillar] of day.pillars.entries()) {
    const visible = GOD_NAMES[pillar.stemSipsin];
    if (visible && index !== 1)
      evidence
        .get(visible)
        ?.visible.push(`${pillar.name} 천간 ${readableCharacter(pillar.stem)}`);
    for (const stem of pillar.jigang.match(/[甲乙丙丁戊己庚辛壬癸]/g) ?? []) {
      const god =
        GOD_NAMES[getRelation(day.pillars[1].stem, stem)?.hanja ?? ""];
      if (god)
        evidence
          .get(god)
          ?.hidden.push(
            `${pillar.name} ${readableCharacter(pillar.branch)} 속 ${readableCharacter(stem)}`,
          );
    }
  }
  return TEN_GOD_GROUPS.map((group) => ({
    name: group.name,
    gods: group.gods.map((god) => evidence.get(god)!),
  }));
}

export function buildNatalEvidence(day: LuckyDay) {
  const master = day.pillars[1].stem;
  const masterElement = day.strength.dayMasterElement;
  const month = day.pillars[2];
  const monthElement = getCharacterElement(month.branch)!;
  const monthMainStem = getJeonggi(month.branch);
  const monthGod =
    GOD_NAMES[getRelation(master, monthMainStem)?.hanja ?? ""] ?? "비견";
  const monthMainExposed = day.pillars.some(
    (pillar, index) => index !== 1 && pillar.stem === monthMainStem,
  );
  const roots = day.pillars.flatMap((pillar) =>
    (pillar.jigang.match(/[甲乙丙丁戊己庚辛壬癸]/g) ?? [])
      .filter((stem) => STEM_INFO[stem]?.element === masterElement)
      .map(
        (stem) =>
          `${pillar.name} ${readableCharacter(pillar.branch)} 속 ${readableCharacter(stem)}`,
      ),
  );
  const supporters = day.pillars
    .filter(
      (pillar, index) =>
        index !== 1 &&
        (STEM_INFO[pillar.stem]?.element === masterElement ||
          GENERATES[STEM_INFO[pillar.stem]?.element as ElementQiKey] ===
            masterElement),
    )
    .map((pillar) => `${pillar.name} ${readableCharacter(pillar.stem)}`);
  const elements = (
    Object.keys(day.elementQi.percentages) as ElementQiKey[]
  ).sort((a, b) => day.elementQi.percentages[b] - day.elementQi.percentages[a]);
  const strongest = elements[0];
  const weakest = elements.at(-1)!;
  const writtenElements = new Set(
    day.pillars.flatMap((pillar) =>
      [
        pillar.stem,
        pillar.branch,
        ...(pillar.jigang.match(/[甲乙丙丁戊己庚辛壬癸]/g) ?? []),
      ]
        .map(getCharacterElement)
        .filter((element): element is ElementQiKey => element !== null),
    ),
  );
  const gods = getTenGodEvidence(day);
  const roleOrder = (
    Object.keys(day.strength.roleQi) as Array<
      keyof LuckyDay["strength"]["roleQi"]
    >
  ).sort(
    (a, b) =>
      day.strength.roleQi[b].percentage - day.strength.roleQi[a].percentage,
  );
  const roleNames: Record<(typeof roleOrder)[number], string> = {
    bigeop: "비겁",
    siksang: "식상",
    jaeseong: "재성",
    gwanseong: "관성",
    insung: "인성",
  };
  const tenGodNames = gods
    .flatMap((group) => group.gods)
    .filter((god) => god.visible.length || god.hidden.length)
    .map((god) => god.name);
  const relation =
    day.relations.pairs
      .flatMap((pair) => {
        const [first, second] = pair.key.split(",").map(Number);
        const left = day.pillars[first];
        const right = day.pillars[second];
        if (!left || !right) return [];
        return [
          ...pair.stem.map(
            (item) =>
              `${left.name} ${readableCharacter(left.stem)}과 ${right.name} ${readableCharacter(right.stem)} 천간의 ${RELATION_NAMES[item.type] ?? item.type}`,
          ),
          ...pair.branch.map(
            (item) =>
              `${left.name} ${readableCharacter(left.branch)}와 ${right.name} ${readableCharacter(right.branch)} 지지의 ${RELATION_NAMES[item.type] ?? item.type}`,
          ),
        ];
      })
      .at(0) ?? null;
  return {
    dayMaster: master,
    dayMasterElement: ELEMENT_NAMES[masterElement],
    monthBranch: month.branch,
    hourPillar: day.pillars[0].ganziHangul,
    hourStemGod: GOD_NAMES[day.pillars[0].stemSipsin] ?? "비견",
    monthElement: ELEMENT_NAMES[monthElement],
    monthMainStem,
    monthGod,
    monthMainExposed,
    seasonalSupport:
      monthElement === masterElement
        ? `${ELEMENT_NAMES[monthElement]} 기운의 월지 ${readableCharacter(month.branch)}가 같은 오행인 일간을 받쳐 줍니다`
        : GENERATES[monthElement] === masterElement
          ? `${ELEMENT_NAMES[monthElement]} 기운의 월지 ${readableCharacter(month.branch)}가 ${ELEMENT_NAMES[masterElement]} 일간을 생합니다`
          : GENERATES[masterElement] === monthElement
            ? `${ELEMENT_NAMES[masterElement]} 일간이 ${ELEMENT_NAMES[monthElement]} 기운의 월지 ${readableCharacter(month.branch)}로 힘을 내보냅니다`
            : CONTROLS[monthElement] === masterElement
              ? `${ELEMENT_NAMES[monthElement]} 기운의 월지 ${readableCharacter(month.branch)}가 ${ELEMENT_NAMES[masterElement]} 일간을 제어하는 관계입니다`
              : `${ELEMENT_NAMES[masterElement]} 일간이 ${ELEMENT_NAMES[monthElement]} 기운의 월지 ${readableCharacter(month.branch)}를 제어하는 관계입니다`,
    roots,
    supporters,
    strength: day.strength.gradeLabel,
    strongest: ELEMENT_NAMES[strongest],
    weakest: ELEMENT_NAMES[weakest],
    missing: (Object.keys(ELEMENT_NAMES) as ElementQiKey[])
      .filter((key) => !writtenElements.has(key))
      .map((key) => ELEMENT_NAMES[key]),
    primaryRole: roleNames[roleOrder[0]],
    secondaryRole: roleNames[roleOrder[1]],
    tenGodNames,
    tenGods: gods,
    relation,
    yongshin: {
      method: day.yongshin.method === "johu" ? "조후" : "억부",
      element: ELEMENT_NAMES[day.yongshin.element],
      present:
        day.yongshin.candidates.length > 0 &&
        day.yongshin.representativeSource !== "daewoon-needed",
      source: day.yongshin.representativeSource,
    },
  };
}

/** 지원하는 원국 데이터만으로 구성한 여섯 단계 해석 근거. */
export function buildSixStepAnalysis(day: LuckyDay) {
  const facts = buildNatalEvidence(day);
  const firstPeriod = day.daewoon[0];
  const firstYear = day.annualFortunes[0];
  return [
    {
      step: "일간과 힘",
      evidence: `${readableCharacter(facts.dayMaster)} 일간, ${readableCharacter(facts.monthBranch)} 월지: ${facts.seasonalSupport}. ${facts.roots.length ? `같은 오행의 지지 뿌리는 ${facts.roots.join(", ")}입니다.` : "같은 오행의 지지 뿌리는 확인되지 않습니다."} ${facts.supporters.length ? `다른 천간의 도움은 ${facts.supporters.join(", ")}에서 확인됩니다.` : "다른 천간의 직접적인 도움은 두드러지지 않습니다."} 종합 강약 판정은 ${facts.strength}입니다.`,
    },
    {
      step: "월지의 사회적 단서",
      evidence: `${facts.monthBranch} 월지 본기 ${facts.monthMainStem}은 일간 기준 ${facts.monthGod}입니다. ${facts.monthMainExposed ? "같은 글자가 다른 천간에도 드러납니다." : "같은 글자는 다른 천간에 직접 드러나지 않습니다."} 이것은 격국의 성패 판정이 아닌 원국의 확인 가능한 단서입니다.`,
    },
    {
      step: "치우침과 보완",
      evidence: `${facts.strongest} 기운이 상대적으로 앞섭니다. ${facts.missing.length ? `${facts.missing.join(", ")} 기운은 원국에 직접 나타나지 않습니다.` : `${facts.weakest} 기운은 상대적으로 조용합니다.`} 조후 상태는 ${day.yongshin.johuStatus}입니다.`,
    },
    {
      step: "용신의 방향",
      evidence: `${facts.yongshin.method} 관점에서 ${facts.yongshin.element} 기운을 보완 방향으로 봅니다. ${facts.yongshin.present ? `대표 글자 ${day.yongshin.representativeChar ?? ""}가 원국에 확인됩니다.` : "대표 글자가 원국에 직접 확인되지 않아 운에서의 보완 가능성을 살펴봅니다."}`,
    },
    {
      step: "겉글자와 지지의 관계",
      evidence: `${facts.primaryRole}은 일간 기준 앞서는 역할입니다. ${facts.relation ? `${facts.relation} 관계가 확인됩니다.` : "기둥 사이에서 계산된 합충 관계는 두드러지지 않습니다."} 지장간의 십성은 겉글자와 구분해 읽습니다.`,
    },
    {
      step: "대운과 연도의 흐름",
      evidence: `${firstPeriod ? `첫 대운 ${firstPeriod.ganziHangul}의 천간 ${GOD_NAMES[firstPeriod.stemSipsin] ?? "본원"}과 지지 ${GOD_NAMES[firstPeriod.branchSipsin] ?? "본원"}을 원국과 함께 살핍니다.` : "대운 자료가 준비되지 않았습니다."} ${firstYear ? `${firstYear.year}년 ${firstYear.ganziHangul}은 해당 연도의 별도 기운입니다.` : "해당 연도의 기운은 별도로 확인합니다."} 특정 사건을 확정하지 않습니다.`,
    },
  ];
}

export function natalEvidenceSentence(day: LuckyDay) {
  const facts = buildNatalEvidence(day);
  const rootText = facts.roots.length
    ? `${facts.roots[0]}에 같은 오행의 뿌리가 있습니다`
    : "지지에 일간과 같은 오행의 뿌리가 두드러지지 않습니다";
  const elementText = facts.missing.length
    ? `${facts.missing.join(", ")} 기운은 원국에 직접 드러나지 않습니다`
    : `${facts.strongest} 기운이 상대적으로 앞서고 ${facts.weakest} 기운은 차분하게 자리합니다`;
  return `${readableCharacter(facts.dayMaster)} 일간을 기준으로 보면, ${facts.seasonalSupport}. ${rootText}. ${elementText}. 월지 ${readableCharacter(facts.monthBranch)}의 본기 ${readableCharacter(facts.monthMainStem)}은 ${facts.monthGod}에 해당합니다. ${facts.monthMainExposed ? "같은 글자가 다른 천간에도 드러나 있습니다." : "같은 글자는 다른 천간에 직접 드러나지 않습니다."} 시주 ${facts.hourPillar}의 천간은 ${facts.hourStemGod}으로 읽습니다.`;
}
