"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { LuckyDaewoon, LuckyDay, LuckyPillar } from "@/lib/lucky-day-types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface LuckyDayDetailDialogProps {
  day: LuckyDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SIPSIN_KO: Record<string, string> = {
  "本元": "본원",
  "比肩": "비견",
  "劫財": "겁재",
  "食神": "식신",
  "傷官": "상관",
  "偏財": "편재",
  "正財": "정재",
  "偏官": "편관",
  "正官": "정관",
  "偏印": "편인",
  "正印": "정인",
};

const UNSEONG_KO: Record<string, string> = {
  "長生": "장생",
  "沐浴": "목욕",
  "冠帶": "관대",
  "建祿": "건록",
  "乾祿": "건록",
  "帝旺": "제왕",
  "衰": "쇠",
  "病": "병",
  "死": "사",
  "墓": "묘",
  "絶": "절",
  "胎": "태",
  "養": "양",
};

const SINSAL_KO: Record<string, string> = {
  "劫殺": "겁살",
  "災殺": "재살",
  "天殺": "천살",
  "地殺": "지살",
  "年殺": "년살",
  "月殺": "월살",
  "亡身": "망신",
  "將星": "장성",
  "攀鞍": "반안",
  "驛馬": "역마",
  "六害": "육해",
  "華蓋": "화개",
};

const RELATION_KO: Record<string, string> = {
  "合": "합",
  "沖": "충",
  "刑": "형",
  "破": "파",
  "害": "해",
  "怨嗔": "원진",
  "鬼門": "귀문",
};

const RELATION_DETAIL_KO: Record<string, string> = {
  "tree": "목",
  "fire": "화",
  "earth": "토",
  "metal": "금",
  "water": "수",
  "自刑": "자형",
};

const CATEGORY_KO: Record<string, string> = {
  "比劫": "비겁",
  "食傷": "식상",
  "財星": "재성",
  "官星": "관성",
  "印星": "인성",
};

const STEM_KO: Record<string, string> = {
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

const BRANCH_KO: Record<string, string> = {
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

type FiveElement = "tree" | "fire" | "earth" | "metal" | "water";

const ELEMENT_KO: Record<FiveElement, string> = {
  tree: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const ELEMENT_ORDER: FiveElement[] = ["tree", "fire", "earth", "metal", "water"];
const GENERATES: Record<FiveElement, FiveElement> = {
  tree: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "tree",
};
const CONTROLS: Record<FiveElement, FiveElement> = {
  tree: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "tree",
};

function translate(value: string, table: Record<string, string>) {
  return table[value] ?? value;
}

function translateBranches(value: string[]) {
  return value.map((branch) => translate(branch, BRANCH_KO)).join(", ");
}

function formatScoreDescription(label: string, description: string) {
  if (label !== "12운성") return description;

  return description
    .split(",")
    .map((value) => translate(value.trim(), UNSEONG_KO))
    .join(", ");
}

function getElementClass(char: string) {
  if ("甲乙寅卯".includes(char)) {
    return "border-green-500 bg-green-500 text-white";
  }
  if ("丙丁巳午".includes(char)) {
    return "border-red-500 bg-red-500 text-white";
  }
  if ("戊己辰戌丑未".includes(char)) {
    return "border-amber-500 bg-amber-500 text-foreground";
  }
  if ("庚辛申酉".includes(char)) {
    return "border-slate-300 bg-white text-foreground";
  }
  if ("壬癸子亥".includes(char)) {
    return "border-neutral-950 bg-neutral-950 text-white";
  }
  return "border-slate-300 bg-white text-foreground";
}

function getElement(char: string): FiveElement {
  if ("甲乙寅卯".includes(char)) return "tree";
  if ("丙丁巳午".includes(char)) return "fire";
  if ("戊己辰戌丑未".includes(char)) return "earth";
  if ("庚辛申酉".includes(char)) return "metal";
  return "water";
}

function getElementFillClass(element: FiveElement) {
  if (element === "tree") return "#22c55e";
  if (element === "fire") return "#ef4444";
  if (element === "earth") return "#facc15";
  if (element === "metal") return "#d6d3d1";
  return "#94a3b8";
}

function getElementRole(dayElement: FiveElement, targetElement: FiveElement) {
  if (dayElement === targetElement) return "비겁";
  if (GENERATES[dayElement] === targetElement) return "식상";
  if (GENERATES[targetElement] === dayElement) return "인성";
  if (CONTROLS[dayElement] === targetElement) return "재성";
  return "관성";
}

function getClockwiseElementsFrom(dayElement: FiveElement) {
  const startIndex = ELEMENT_ORDER.indexOf(dayElement);

  return [
    ...ELEMENT_ORDER.slice(startIndex),
    ...ELEMENT_ORDER.slice(0, startIndex),
  ];
}

function GanjiTile({ value, size = "lg" }: { value: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-semibold leading-none shadow-sm",
        getElementClass(value),
        size === "lg" ? "size-10 text-2xl sm:size-12 sm:text-3xl" : "size-8 text-xl"
      )}
    >
      {value}
    </span>
  );
}

function HiddenStemChips({ value }: { value: string }) {
  const chars = [...value].filter((char) => char.trim());

  if (chars.length === 0) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded text-sm font-semibold",
            getElementClass(char)
          )}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

function SajuPillarColumn({
  pillar,
  isGongmang,
}: {
  pillar: LuckyPillar;
  isGongmang: boolean;
}) {
  return (
    <div className="grid min-w-0 justify-items-center gap-2 text-center">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{pillar.name}</p>
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">
        {translate(pillar.stemSipsin, SIPSIN_KO)}
      </p>
      <GanjiTile value={pillar.stem} />
      <GanjiTile value={pillar.branch} />
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">
        {translate(pillar.branchSipsin, SIPSIN_KO)}
      </p>
      <div className="mt-1 space-y-1 text-xs text-foreground sm:text-sm">
        <p>{translate(pillar.unseong, UNSEONG_KO)}</p>
        <p>{translate(pillar.sinsal, SINSAL_KO)}</p>
        <HiddenStemChips value={pillar.jigang} />
        <p className="text-muted-foreground">{isGongmang ? "공망" : "-"}</p>
      </div>
    </div>
  );
}

function SajuChart({ day }: { day: LuckyDay }) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">사주팔자</h3>
      </div>
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-4">
        <div className="grid gap-2 pt-8 text-xs font-medium text-muted-foreground sm:text-sm">
          <p>십성</p>
          <p className="flex h-12 items-center">천간</p>
          <p className="flex h-12 items-center">지지</p>
          <p>십성</p>
          <div className="my-1 h-px bg-border" />
          <p>운성</p>
          <p>신살</p>
          <p>장간</p>
          <p>공망</p>
        </div>
        <div className="min-w-0">
          <div className="grid grid-cols-4 gap-2 sm:gap-5">
            {day.pillars.map((pillar, index) => (
              <SajuPillarColumn
                key={pillar.name}
                pillar={pillar}
                isGongmang={day.gongmang.pillarIndices.includes(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ElementQiChart({ day }: { day: LuckyDay }) {
  const dayElement = getElement(day.pillars[1].stem);
  const radius = 12;
  const clockwiseElements = getClockwiseElementsFrom(dayElement);
  const positionSlots = [
    { x: 50, y: 18 },
    { x: 82, y: 41 },
    { x: 70, y: 78 },
    { x: 30, y: 78 },
    { x: 18, y: 41 },
  ];
  const positions = clockwiseElements.reduce<Record<FiveElement, { x: number; y: number }>>(
    (acc, element, index) => ({
      ...acc,
      [element]: positionSlots[index],
    }),
    {
      tree: positionSlots[0],
      fire: positionSlots[1],
      earth: positionSlots[2],
      metal: positionSlots[3],
      water: positionSlots[4],
    }
  );
  const generatedPaths: Array<[FiveElement, FiveElement]> = [
    ["tree", "fire"],
    ["fire", "earth"],
    ["earth", "metal"],
    ["metal", "water"],
    ["water", "tree"],
  ];
  const controlledPaths: Array<[FiveElement, FiveElement]> = [
    ["tree", "earth"],
    ["earth", "water"],
    ["water", "fire"],
    ["fire", "metal"],
    ["metal", "tree"],
  ];
  const getTrimmedLine = (from: FiveElement, to: FiveElement, inset = 3) => {
    const start = positions[from];
    const end = positions[to];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const trim = radius + inset;

    return {
      x1: start.x + ux * trim,
      y1: start.y + uy * trim,
      x2: end.x - ux * trim,
      y2: end.y - uy * trim,
    };
  };

  return (
    <section className="rounded-lg border bg-background p-4">
      <h3 className="text-lg font-semibold">나의 오행·기도</h3>
      <div className="mt-3 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-8 bg-blue-500" />
          <span>생</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-8 bg-red-500" />
          <span>극</span>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-[34rem]">
        <svg
          className="block h-auto w-full"
          viewBox="0 0 100 100"
          role="img"
          aria-label="오행 분포와 생극 관계 그래프"
        >
          <defs>
            <marker
              id="generate-arrowhead"
              markerHeight="3"
              markerWidth="3"
              orient="auto"
              refX="2.4"
              refY="1.5"
            >
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#3b82f6" />
            </marker>
            <marker
              id="control-arrowhead"
              markerHeight="3"
              markerWidth="3"
              orient="auto"
              refX="2.4"
              refY="1.5"
            >
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#ef4444" />
            </marker>
            {ELEMENT_ORDER.map((element) => (
              <clipPath key={element} id={`element-clip-${element}`}>
                <circle cx={positions[element].x} cy={positions[element].y} r={radius} />
              </clipPath>
            ))}
          </defs>

          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {generatedPaths.map(([from, to]) => {
              const line = getTrimmedLine(from, to);

              return (
                <line
                  key={`generate-${from}-${to}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#3b82f6"
                  strokeWidth="1"
                  markerEnd="url(#generate-arrowhead)"
                />
              );
            })}
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.82">
            {controlledPaths.map(([from, to]) => {
              const line = getTrimmedLine(from, to, 4);

              return (
                <line
                  key={`control-${from}-${to}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#ef4444"
                  strokeWidth="1.1"
                  markerEnd="url(#control-arrowhead)"
                />
              );
            })}
          </g>

          {clockwiseElements.map((element) => {
            const position = positions[element];
            const percent = day.elementQi.percentages[element];
            const fillHeight = (radius * 2 * Math.min(100, Math.max(0, percent))) / 100;
            const fillTop = position.y + radius - fillHeight;

            return (
              <g key={element}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={radius}
                  fill="white"
                  stroke="#d6d3d1"
                  strokeWidth="0.7"
                />
                <rect
                  x={position.x - radius}
                  y={fillTop}
                  width={radius * 2}
                  height={fillHeight}
                  fill={getElementFillClass(element)}
                  opacity="0.75"
                  clipPath={`url(#element-clip-${element})`}
                />
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={radius}
                  fill="none"
                  stroke="#b9b4af"
                  strokeWidth="0.7"
                />
                <text
                  x={position.x}
                  y={position.y - 2}
                  textAnchor="middle"
                  className="fill-stone-700 text-[3.4px] font-semibold"
                >
                  {ELEMENT_KO[element]}({getElementRole(dayElement, element)})
                </text>
                <text
                  x={position.x}
                  y={position.y + 5.8}
                  textAnchor="middle"
                  className="fill-stone-700 text-[5px] font-bold"
                >
                  {percent.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        {ELEMENT_ORDER.map((element) => (
          <div key={element} className="rounded-md border bg-secondary/40 px-2 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              {ELEMENT_KO[element]}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {day.elementQi.percentages[element].toFixed(1)}%
            </p>
            <p className="text-[11px] text-muted-foreground">
              {day.elementQi.totals[element].toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DaewoonColumn({
  item,
  active,
}: {
  item: LuckyDaewoon;
  active: boolean;
}) {
  const [stem, branch] = [...item.ganzi];

  return (
    <div
      className={cn(
        "grid min-w-0 justify-items-center gap-1 rounded-xl px-1.5 py-3 text-center",
        active && "border-2 border-amber-500 bg-amber-50"
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{item.age}세</p>
      <p className="text-sm font-medium text-muted-foreground">
        {translate(item.stemSipsin, SIPSIN_KO)}
      </p>
      <GanjiTile value={stem} size="sm" />
      <GanjiTile value={branch} size="sm" />
      <p className="text-sm font-medium text-muted-foreground">
        {translate(item.branchSipsin, SIPSIN_KO)}
      </p>
      <p className="text-sm text-muted-foreground">
        {translate(item.unseong, UNSEONG_KO)}
      </p>
      <p className="text-sm text-muted-foreground">
        {translate(item.sinsal, SINSAL_KO)}
      </p>
      <p className="text-sm text-muted-foreground">
        {item.isGongmang ? "공망" : "-"}
      </p>
    </div>
  );
}

function DaewoonChart({ day }: { day: LuckyDay }) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <h3 className="text-lg font-semibold">대운</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {day.daewoon.map((item, index) => (
          <DaewoonColumn key={item.index} item={item} active={index === 0} />
        ))}
      </div>
    </section>
  );
}

const ELEMENT_EN: Record<FiveElement, string> = {
  tree: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
};

const ELEMENT_BAR_CLASS: Record<FiveElement, string> = {
  tree: "bg-green-500",
  fire: "bg-red-500",
  earth: "bg-yellow-400",
  metal: "bg-neutral-400",
  water: "bg-blue-500",
};

const REPORT_THEMES = [
  "Theme 1. 타고난 그릇과 기질 (일주론/12운성 성격)",
  "Theme 2. 평생의 성공과 재능 (식재관/직업 적성)",
  "Theme 3. 소형 업상대체 양육 솔루션 (건강/오감치료)",
  "Theme 4. 인생의 타이밍과 변화의 나침반 (대운 분석)",
];

function elementLabelForChar(char: string) {
  const element = getElement(char);
  return `${ELEMENT_KO[element]}/${ELEMENT_EN[element]}`;
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-background p-4 sm:p-5">
      <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ReportSajuCombination({ day }: { day: LuckyDay }) {
  return (
    <ReportSection title="Step 1. 사주팔자 공식 (Saju Combination)">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {day.pillars.map((pillar) => (
          <div key={pillar.name} className="min-w-0 space-y-3 text-center">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {pillar.name.replace("주", "")} ({pillar.name === "시주" ? "Hour" : pillar.name === "일주" ? "Day" : pillar.name === "월주" ? "Month" : "Year"})
            </p>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {pillar.stem} <span className="text-sm text-muted-foreground">({elementLabelForChar(pillar.stem)})</span>
              </p>
              <p className="text-lg font-semibold">
                {pillar.branch} <span className="text-sm text-muted-foreground">({elementLabelForChar(pillar.branch)})</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              ({[...pillar.jigang].filter((char) => char.trim()).join("/") || "-"})
            </p>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

function getLifeCycleSeason(index: number) {
  return ["봄 (Spring)", "여름 (Summer)", "가을 (Autumn)", "겨울 (Winter)"][
    index % 4
  ];
}

function ReportDaewoonTimeline({ day }: { day: LuckyDay }) {
  const timeline = day.daewoon.slice(0, 4);

  return (
    <ReportSection title="Step 2. 10년 단위 대운 흐름 (Life-Cycle Timeline)">
      <div className="grid gap-3 sm:grid-cols-4">
        {timeline.map((item, index) => (
          <div key={item.index} className="relative rounded-md border bg-secondary/30 p-3 text-center">
            {index < timeline.length - 1 && (
              <span className="absolute right-[-0.9rem] top-1/2 hidden h-px w-5 bg-border sm:block" />
            )}
            <div className="mx-auto flex size-12 items-center justify-center rounded-full border bg-background text-xs font-semibold">
              {item.age}-{item.age + 9}
            </div>
            <p className="mt-3 text-sm font-medium">{item.ganziHangul}</p>
            <p className="text-xs text-muted-foreground">
              {translate(item.unseong, UNSEONG_KO)} · {getLifeCycleSeason(index)}
            </p>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

function ReportElementRatio({ day }: { day: LuckyDay }) {
  return (
    <ReportSection title="Step 3. 오행 분석 및 기도 비율 (Energy Ratio)">
      <div className="space-y-3">
        {ELEMENT_ORDER.map((element) => {
          const value = day.elementQi.percentages[element];

          return (
            <div
              key={element}
              className="grid items-center gap-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <p className="font-medium">
                {ELEMENT_EN[element]} ({ELEMENT_KO[element]}){" "}
                <span className="text-muted-foreground">{value.toFixed(1)}%</span>
              </p>
              <div className="h-5 overflow-hidden rounded-sm bg-secondary">
                <div
                  className={cn("h-full", ELEMENT_BAR_CLASS[element])}
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}

function ReportThemeList() {
  return (
    <ReportSection title="Step 4. 4대 프리미엄 분석 테마 해설 (Themes)">
      <div className="space-y-2">
        {REPORT_THEMES.map((theme) => (
          <div
            key={theme}
            className="flex items-center justify-between gap-3 rounded-md bg-secondary px-4 py-4 text-sm font-medium"
          >
            <span>{theme}</span>
            <span className="text-muted-foreground">&gt;</span>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

function ReportGoldenMessage({ day }: { day: LuckyDay }) {
  const strongest = ELEMENT_ORDER.reduce((best, element) =>
    day.elementQi.percentages[element] > day.elementQi.percentages[best] ? element : best
  );

  return (
    <section className="rounded-lg bg-primary p-5 text-primary-foreground">
      <h3 className="text-sm font-semibold sm:text-base">
        Step 5. [요약] 골든 메시지 (Summary)
      </h3>
      <p className="mt-8 text-sm leading-relaxed text-primary-foreground/75">
        {day.dayPillarHangul} 일주는 {ELEMENT_KO[strongest]} 기운을 중심으로 삶의
        방향을 세우는 후보입니다. 세부 해설은 프리미엄 테마 콘텐츠와 대운 분석
        데이터가 연결되면 확장됩니다.
      </p>
    </section>
  );
}

function ReportBottomNav() {
  return (
    <div className="grid grid-cols-3 border-t bg-secondary/80 text-center text-xs font-medium text-muted-foreground">
      <span className="py-3">Home</span>
      <span className="py-3 text-foreground">Selection</span>
      <span className="py-3">My Page</span>
    </div>
  );
}

export function LuckyDayDetailDialog({
  day,
  open,
  onOpenChange,
}: LuckyDayDetailDialogProps) {
  if (!day) return null;

  const dateObj = new Date(`${day.date}T00:00:00`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 sm:max-w-4xl">
        <div className="space-y-5 p-5 sm:p-8">
          <DialogHeader className="items-center text-center">
            <div className="flex items-center gap-2">
              <Badge variant="default">Rank {day.rank}</Badge>
              <Badge variant="secondary">Score {day.score.toFixed(1)}</Badge>
            </div>
            <DialogTitle className="pt-4 text-2xl font-semibold tracking-tight">
              PREMIUM BIRTHDAY REPORT
            </DialogTitle>
            <DialogDescription>
              삶의 지도와 나침반 (Life Guide & Compass)
            </DialogDescription>
            <div className="h-px w-full max-w-xl bg-border" />
            <p className="text-sm font-medium">
              {format(dateObj, "yyyy년 M월 d일 (EEE)", { locale: ko })} · {day.timeLabel}
            </p>
          </DialogHeader>

          <ReportSajuCombination day={day} />
          <ReportDaewoonTimeline day={day} />
          <ReportElementRatio day={day} />
          <ReportThemeList />
          <ReportGoldenMessage day={day} />
        </div>
        <ReportBottomNav />
      </DialogContent>
    </Dialog>
  );
}
