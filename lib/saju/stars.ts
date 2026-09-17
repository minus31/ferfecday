import { BRANCH_WONJIN, BRANCH_GWIMUN } from "@orrery/core/constants";
import type { LuckyDay } from "../lucky-day-types";
export const SAJU_LABELS: Record<string, string> = {
  本元: "본원",
  比肩: "비견",
  劫財: "겁재",
  食神: "식신",
  傷官: "상관",
  偏財: "편재",
  正財: "정재",
  偏官: "편관",
  正官: "정관",
  偏印: "편인",
  正印: "정인",
  長生: "장생",
  沐浴: "목욕",
  冠帶: "관대",
  建祿: "건록",
  乾祿: "건록",
  帝旺: "제왕",
  衰: "쇠",
  病: "병",
  死: "사",
  墓: "묘",
  絶: "절",
  胎: "태",
  養: "양",
  劫殺: "겁살",
  災殺: "재살",
  天殺: "천살",
  地殺: "지살",
  年殺: "년살",
  月殺: "월살",
  亡身: "망신살",
  將星: "장성살",
  攀鞍: "반안살",
  驛馬: "역마살",
  六害: "육해살",
  華蓋: "화개살",
  合: "합",
  沖: "충",
  刑: "형",
  害: "해",
  破: "파",
  怨嗔: "원진살",
  鬼門: "귀문관살",
  三合: "삼합",
  方合: "방합",
  半合: "반합",
  自刑: "자형",
};
export function sajuLabel(value: string) {
  return SAJU_LABELS[value] || value;
}
const SPECIAL: Array<[keyof LuckyDay["specialSals"], string]> = [
  ["cheonul", "천을귀인"],
  ["cheonduk", "천덕귀인"],
  ["wolduk", "월덕귀인"],
  ["munchang", "문창귀인"],
  ["geumyeo", "금여록"],
  ["dohwa", "도화살"],
  ["yangin", "양인살"],
  ["baekho", "백호살"],
  ["goegang", "괴강살"],
  ["hongyeom", "홍염살"],
];
export function collectStars(day: LuckyDay) {
  const pillars = day.pillars.map((pillar, index) => {
    const stars = SPECIAL.filter(([key]) => {
      const value = day.specialSals[key];
      return Array.isArray(value)
        ? value.includes(index)
        : index === 1 && value;
    }).map(([, label]) => label);
    if (pillar.sinsal) stars.push(sajuLabel(pillar.sinsal));
    if (day.gongmang.pillarIndices.includes(index)) stars.push("공망");
    if (
      index === 1
        ? ["甲辰", "乙丑", "丁丑", "己丑", "庚戌", "辛未", "壬戌"].includes(
            pillar.ganzi,
          )
        : ["辰", "戌", "丑", "未"].includes(pillar.branch)
    )
      stars.push("재고귀인");
    return stars;
  });
  const relations = new Set<string>();
  for (const pair of day.relations.pairs) {
    const indices = pair.key.split(",").map(Number);
    const names = indices
      .map((index) => day.pillars[index]?.name || "")
      .join(" ↔ ");
    for (const [kind, items] of [
      ["천간", pair.stem],
      ["지지", pair.branch],
    ] as const)
      for (const item of items) {
        const label = sajuLabel(item.type);
        relations.add(`${names}, ${kind} ${label}`);
        if (
          ["怨嗔", "鬼門", "刑", "自刑", "沖", "害", "破"].includes(item.type)
        )
          indices.forEach((index) => pillars[index]?.push(label));
      }
  }
  // 엔진의 관계 반환 옵션과 무관하게 모든 여섯 지지 조합을 확인한다.
  for (let i = 0; i < day.pillars.length; i++)
    for (let j = i + 1; j < day.pillars.length; j++) {
      const a = day.pillars[i],
        b = day.pillars[j];
      for (const [table, label] of [
        [BRANCH_WONJIN, "원진살"],
        [BRANCH_GWIMUN, "귀문관살"],
      ] as const) {
        if (
          Object.hasOwn(table, `${a.branch},${b.branch}`) ||
          Object.hasOwn(table, `${b.branch},${a.branch}`)
        ) {
          pillars[i].push(label);
          pillars[j].push(label);
          relations.add(`${a.name} ↔ ${b.name}, 지지 ${label}`);
        }
      }
      if (
        j === i + 1 &&
        ((a.branch === "戌" && b.branch === "亥") ||
          (a.branch === "亥" && b.branch === "戌") ||
          (a.branch === "辰" && b.branch === "巳") ||
          (a.branch === "巳" && b.branch === "辰"))
      ) {
        pillars[i].push("천라지망");
        pillars[j].push("천라지망");
        relations.add(`${a.name} ↔ ${b.name}, 천라지망`);
      }
    }
  for (const group of [
    ["寅", "巳", "申"],
    ["丑", "戌", "未"],
  ])
    if (group.every((branch) => day.pillars.some((p) => p.branch === branch))) {
      day.pillars.forEach((p, index) => {
        if (group.includes(p.branch)) pillars[index].push("삼형살");
      });
      relations.add(`${group.join("")}, 삼형살`);
    }
  for (const item of [...day.relations.triple, ...day.relations.directional])
    relations.add(sajuLabel(item.type));
  return {
    pillars: pillars.map((items) => [...new Set(items)]),
    relations: [...relations],
  };
}
