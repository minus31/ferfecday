"use client";

import * as React from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Brain,
  ChevronDown,
  Compass,
  Heart,
  House,
  MessageCircle,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LuckyAnnualFortune, LuckyDaewoon, LuckyDay, LuckyPillar } from "@/lib/lucky-day-types";
import { getDayPillarProfile } from "@/lib/saju/day-pillar-profiles";
import {
  buildFriendlySajuSections,
  buildIntegratedSajuReport,
  evaluateFriendlySajuSections,
  sanitizeFriendlySajuText,
  type FriendlyReportSection,
  type FriendlySectionIcon,
} from "@/lib/saju/integrated-report";
import { cn } from "@/lib/utils";

interface LuckyDayDetailDialogProps {
  day: LuckyDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FiveElement = "tree" | "fire" | "earth" | "metal" | "water";

const STEM_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
const BRANCH_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};
const SIPSIN_KO: Record<string, string> = {
  本元: "본원", 比肩: "비견", 劫財: "겁재", 食神: "식신", 傷官: "상관",
  偏財: "편재", 正財: "정재", 偏官: "편관", 正官: "정관", 偏印: "편인", 正印: "정인",
};
const UNSEONG_KO: Record<string, string> = {
  長生: "장생", 沐浴: "목욕", 冠帶: "관대", 建祿: "건록", 乾祿: "건록",
  帝旺: "제왕", 衰: "쇠", 病: "병", 死: "사", 墓: "묘", 絶: "절", 胎: "태", 養: "양",
};
const SINSAL_KO: Record<string, string> = {
  劫殺: "겁살", 災殺: "재살", 天殺: "천살", 地殺: "지살", 年殺: "년살", 月殺: "월살",
  亡身: "망신살", 將星: "장성살", 攀鞍: "반안살", 驛馬: "역마살", 六害: "육해살", 華蓋: "화개살",
};
const ELEMENT_KO: Record<FiveElement, string> = {
  tree: "목", fire: "화", earth: "토", metal: "금", water: "수",
};
const ELEMENT_HANJA: Record<FiveElement, string> = {
  tree: "木", fire: "火", earth: "土", metal: "金", water: "水",
};
const ELEMENT_COLORS: Record<FiveElement, string> = {
  tree: "#3f9b64", fire: "#e56b6f", earth: "#d59a45", metal: "#8f8c87", water: "#55769a",
};
const ELEMENT_TEXT_CLASS: Record<FiveElement, string> = {
  tree: "text-emerald-700", fire: "text-rose-600", earth: "text-amber-600",
  metal: "text-stone-500", water: "text-slate-700",
};
const ELEMENT_BG_CLASS: Record<FiveElement, string> = {
  tree: "bg-emerald-100", fire: "bg-rose-100", earth: "bg-amber-100",
  metal: "bg-stone-200", water: "bg-slate-200",
};
const ELEMENT_ORDER: FiveElement[] = ["tree", "fire", "earth", "metal", "water"];
const GENERATES: Record<FiveElement, FiveElement> = {
  tree: "fire", fire: "earth", earth: "metal", metal: "water", water: "tree",
};
const CONTROLS: Record<FiveElement, FiveElement> = {
  tree: "earth", earth: "water", water: "fire", fire: "metal", metal: "tree",
};

const FRIENDLY_SECTION_ICON: Record<FriendlySectionIcon, LucideIcon> = {
  sparkles: Sparkles,
  heart: Heart,
  brain: Brain,
  message: MessageCircle,
  users: Users,
  shield: ShieldCheck,
  compass: Compass,
  wallet: WalletCards,
  home: House,
  route: Route,
};

function tr(value: string, table: Record<string, string>) {
  return table[value] ?? value;
}

function getElement(char: string): FiveElement {
  if ("甲乙寅卯".includes(char)) return "tree";
  if ("丙丁巳午".includes(char)) return "fire";
  if ("戊己辰戌丑未".includes(char)) return "earth";
  if ("庚辛申酉".includes(char)) return "metal";
  return "water";
}

function getRole(dayElement: FiveElement, target: FiveElement) {
  if (dayElement === target) return "비겁";
  if (GENERATES[dayElement] === target) return "식상";
  if (GENERATES[target] === dayElement) return "인성";
  if (CONTROLS[dayElement] === target) return "재성";
  return "관성";
}

function rotateElements(dayElement: FiveElement) {
  const index = ELEMENT_ORDER.indexOf(dayElement);
  return [...ELEMENT_ORDER.slice(index), ...ELEMENT_ORDER.slice(0, index)];
}

function Section({ title, children }: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-3 shadow-[0_4px_12px_rgba(36,30,34,0.08)] sm:p-6">
      <div>
        <h3 className="font-serif text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

function GanjiValue({ char, compact = false }: { char: string; compact?: boolean }) {
  const element = getElement(char);
  const hangul = STEM_KO[char] ?? BRANCH_KO[char] ?? char;
  return (
    <div className={cn("font-bold leading-none", ELEMENT_TEXT_CLASS[element])}>
      <span className={compact ? "text-2xl" : "text-xl sm:text-4xl"}>{char}</span>
      <span className={cn("ml-0.5 font-semibold sm:ml-1", compact ? "text-xs" : "text-[10px] sm:text-sm")}>{hangul}</span>
      {!compact && (
        <span className="mt-1 block text-[9px] font-medium opacity-75 sm:text-[10px]">
          {ELEMENT_KO[element]} · {ELEMENT_HANJA[element]}
        </span>
      )}
    </div>
  );
}

function SajuTable({ day }: { day: LuckyDay }) {
  const rows: Array<{ label: string; render: (pillar: LuckyPillar, index: number) => React.ReactNode; className?: string }> = [
    { label: "천간", render: (pillar) => <GanjiValue char={pillar.stem} /> , className: "py-4" },
    { label: "십성", render: (pillar) => tr(pillar.stemSipsin, SIPSIN_KO) },
    { label: "지지", render: (pillar) => <GanjiValue char={pillar.branch} />, className: "py-4" },
    { label: "십성", render: (pillar) => tr(pillar.branchSipsin, SIPSIN_KO) },
    { label: "지장간", render: (pillar) => [...pillar.jigang].map((char) => STEM_KO[char] ?? char).join("·") || "-" },
    { label: "12운성", render: (pillar) => tr(pillar.unseong, UNSEONG_KO) },
    { label: "12신살", render: (pillar) => tr(pillar.sinsal, SINSAL_KO) },
    { label: "공망", render: (_, index) => day.gongmang.pillarIndices.includes(index) ? "공망" : "-" },
  ];

  return (
    <Section title="사주 테이블">
      <div className="w-full rounded-md border border-border">
        <div className="grid grid-cols-[2.75rem_repeat(4,minmax(0,1fr))] bg-background text-center text-[10px] font-semibold sm:grid-cols-[5rem_repeat(4,minmax(0,1fr))] sm:text-sm">
          <div className="border-r border-border p-1.5 sm:p-2" />
          {day.pillars.map((pillar) => <div key={pillar.name} className="border-r border-border p-1.5 last:border-r-0 sm:p-2">{pillar.name}</div>)}
        </div>
        {rows.map((row, rowIndex) => (
          <div key={`${row.label}-${rowIndex}`} className="grid grid-cols-[2.75rem_repeat(4,minmax(0,1fr))] border-t border-border text-center text-[10px] sm:grid-cols-[5rem_repeat(4,minmax(0,1fr))] sm:text-sm">
            <div className="flex items-center justify-center border-r border-border bg-background p-1 font-semibold text-muted-foreground sm:justify-start sm:p-2">{row.label}</div>
            {day.pillars.map((pillar, index) => (
              <div key={`${pillar.name}-${row.label}`} className={cn("flex min-w-0 items-center justify-center overflow-hidden border-r border-border px-0.5 py-2 font-medium last:border-r-0 sm:px-1.5", row.className)}>
                {row.render(pillar, index)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

function ElementPentagon({ day }: { day: LuckyDay }) {
  const dayElement = getElement(day.pillars[1].stem);
  const elements = rotateElements(dayElement);
  const center = { x: 50, y: 49 };
  const radius = 31;
  const points = elements.map((element, index) => {
    const angle = (-90 + index * 72) * Math.PI / 180;
    return { element, x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
  const dataPoints = points.map(({ element, x, y }) => {
    const ratio = Math.max(0.12, Math.min(1, day.elementQi.percentages[element] / 40));
    return `${center.x + (x - center.x) * ratio},${center.y + (y - center.y) * ratio}`;
  }).join(" ");

  return (
    <Section title="오행 기도">
      <div className="mx-auto max-w-xl">
        <svg viewBox="0 0 100 102" className="h-auto w-full" role="img" aria-label="오행 기도 오각형 차트">
          {[1, 0.66, 0.33].map((scale) => (
            <polygon key={scale} points={points.map(({ x, y }) => `${center.x + (x - center.x) * scale},${center.y + (y - center.y) * scale}`).join(" ")} fill="none" stroke="#d6d3d1" strokeWidth="0.35" />
          ))}
          {points.map(({ x, y, element }) => <line key={element} x1={center.x} y1={center.y} x2={x} y2={y} stroke="#e7e5e4" strokeWidth="0.35" />)}
          <polygon points={dataPoints} fill="rgba(110,59,99,.12)" stroke="#6e3b63" strokeWidth="0.65" />
          {points.map(({ element, x, y }, index) => {
            const labelX = center.x + (x - center.x) * 1.34;
            const labelY = center.y + (y - center.y) * 1.34;
            return (
              <g key={element}>
                <circle cx={x} cy={y} r="2" fill={ELEMENT_COLORS[element]} />
                <text x={labelX} y={labelY - 1.5} textAnchor="middle" fill={ELEMENT_COLORS[element]} className="text-[3.4px] font-bold">
                  {ELEMENT_KO[element]}({getRole(dayElement, element)}){index === 0 ? " · 일간" : ""}
                </text>
                <text x={labelX} y={labelY + 3} textAnchor="middle" fill={ELEMENT_COLORS[element]} opacity="0.82" className="text-[3.1px] font-semibold">
                  {day.elementQi.percentages[element].toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Section>
  );
}

const SPECIAL_SAL_META: Array<{ key: keyof LuckyDay["specialSals"]; label: string }> = [
  { key: "cheonul", label: "천을귀인" }, { key: "cheonduk", label: "천덕귀인" },
  { key: "wolduk", label: "월덕귀인" }, { key: "munchang", label: "문창귀인" },
  { key: "geumyeo", label: "금여록" }, { key: "dohwa", label: "도화살" },
  { key: "yangin", label: "양인살" },
];

function getPillarStars(day: LuckyDay, index: number) {
  const stars = SPECIAL_SAL_META.filter(({ key }) => {
    const value = day.specialSals[key];
    return Array.isArray(value) && value.includes(index);
  }).map(({ label }) => label);
  if (index === 1 && day.specialSals.baekho) stars.push("백호살");
  if (index === 1 && day.specialSals.goegang) stars.push("괴강살");
  if (index === 1 && day.specialSals.hongyeom) stars.push("홍염살");
  return stars;
}

function StarsTable({ day }: { day: LuckyDay }) {
  return (
    <Section title="신살과 길성">
      <div className="w-full rounded-md border border-border">
        <div className="grid grid-cols-[2.75rem_repeat(4,minmax(0,1fr))] bg-background text-center text-[10px] font-semibold sm:grid-cols-[5rem_repeat(4,minmax(0,1fr))] sm:text-sm">
          <div className="border-r border-border p-1.5 sm:p-2" />
          {day.pillars.map((pillar) => <div key={pillar.name} className="border-r border-border p-1.5 last:border-r-0 sm:p-2">{pillar.name}</div>)}
        </div>
        <div className="grid grid-cols-[2.75rem_repeat(4,minmax(0,1fr))] border-t border-border text-center text-[9px] leading-5 sm:grid-cols-[5rem_repeat(4,minmax(0,1fr))] sm:text-sm">
          <div className="flex items-center justify-center border-r border-border bg-background p-1 font-semibold text-muted-foreground sm:justify-start sm:p-2">지지</div>
          {day.pillars.map((pillar, index) => (
            <div key={pillar.name} className="min-h-24 overflow-hidden border-r border-border px-0.5 py-2 last:border-r-0 sm:p-2">
              {getPillarStars(day, index).length ? getPillarStars(day, index).map((star) => <p key={star}>{star}</p>) : <p className="text-muted-foreground">-</p>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Yongshin({ day }: { day: LuckyDay }) {
  return (
    <Section title="용신">
      <div className="rounded-md border border-accent bg-gold-soft p-4">
        <p className="font-mono text-xs font-semibold tracking-wide text-primary">용신</p>
        <p className="mt-1 text-lg font-bold">
          {day.yongshin.method === "johu" ? "조후용신" : "억부용신"} : {ELEMENT_KO[day.yongshin.element]}({ELEMENT_HANJA[day.yongshin.element]})
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{day.yongshin.message}</p>
      </div>
    </Section>
  );
}

function StrengthChart({ day }: { day: LuckyDay }) {
  const labels = ["극신약", "태신약", "약신약", "중화신약", "중화신강", "약신강", "태신강", "극신강"];
  const position = Math.max(0, Math.min(100, (day.strength.si + 50) / 100 * 100));
  return (
    <Section title="신강 / 신약 지수">
      <div className="rounded-md border border-border bg-background p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>득령 {day.strength.roleQi.insung.percentage >= 20 ? "●" : "×"}</span>
          <span>득지 {day.strength.roleQi.bigeop.percentage >= 20 ? "●" : "×"}</span>
          <span>득시 {day.strength.supportQi >= day.strength.drainControlQi ? "●" : "×"}</span>
          <strong className="text-primary">{day.strength.gradeLabel}</strong>
        </div>
        <p className="mt-5 text-sm leading-7">이 사주는 <strong>{day.strength.gradeLabel}</strong>에 해당합니다. 생조 {day.strength.supportQi.toFixed(1)}와 극설 {day.strength.drainControlQi.toFixed(1)}의 균형으로 산출했습니다.</p>
        <div className="mt-10">
          <div className="relative h-6">
            <div className="absolute inset-x-0 top-2 h-2 rounded-full bg-gradient-to-r from-sky-300 via-stone-200 to-rose-300" />
            <div className="absolute top-0 -translate-x-1/2" style={{ left: `${Math.max(1, Math.min(99, position))}%` }}>
              <span className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold">나</span>
              <div className="size-6 rounded-full border-4 border-card bg-primary shadow" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-y-2 text-center text-[9px] text-muted-foreground sm:grid-cols-8 sm:text-xs">
            {labels.map((label) => <span key={label}>{label}</span>)}
          </div>
        </div>
      </div>
    </Section>
  );
}

function FortuneGanji({ ganzi }: { ganzi: string }) {
  return (
    <div className="grid gap-1">
      {[...ganzi].map((char, index) => {
        const element = getElement(char);
        return <div key={`${char}-${index}`} className={cn("flex size-12 items-center justify-center rounded-lg text-2xl font-bold", ELEMENT_BG_CLASS[element], ELEMENT_TEXT_CLASS[element])}>{char}</div>;
      })}
    </div>
  );
}

function FortuneColumn({
  item,
  selected = false,
  onSelect,
}: {
  item: LuckyDaewoon | LuckyAnnualFortune;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const isDaewoon = "age" in item;
  const content = (
    <div className="grid justify-items-center gap-2 text-center">
      <div className="h-10 text-sm font-semibold leading-5">
        <p>{isDaewoon ? `${item.age}세` : item.year}</p>
        <p className="text-xs text-muted-foreground">{tr(item.stemSipsin, SIPSIN_KO)}</p>
      </div>
      <FortuneGanji ganzi={item.ganzi} />
      <div className="text-xs leading-5 text-muted-foreground">
        <p>{tr(item.branchSipsin, SIPSIN_KO)}</p>
        <p>{tr(item.unseong, UNSEONG_KO)}</p>
        <p>{tr(item.sinsal, SINSAL_KO)}</p>
      </div>
    </div>
  );
  if (!onSelect) return <div className="w-[5.3rem] shrink-0">{content}</div>;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-[5.3rem] shrink-0 rounded-xl border px-1 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        selected ? "border-primary bg-gold-soft shadow-sm" : "border-transparent hover:border-border hover:bg-background",
      )}
    >
      {content}
    </button>
  );
}

function FortuneFlow({ day }: { day: LuckyDay }) {
  const reversedDaewoon = [...day.daewoon].reverse();
  const [selectedIndex, setSelectedIndex] = React.useState(day.daewoon[0]?.index ?? 1);
  React.useEffect(() => setSelectedIndex(day.daewoon[0]?.index ?? 1), [day]);
  const selectedDaewoon = day.daewoon.find((item) => item.index === selectedIndex) ?? day.daewoon[0];
  const selectedPosition = day.daewoon.findIndex((item) => item.index === selectedDaewoon?.index);
  const nextDaewoon = selectedPosition >= 0 ? day.daewoon[selectedPosition + 1] : undefined;
  const birthYear = Number(day.date.slice(0, 4));
  const startYear = selectedDaewoon ? birthYear + selectedDaewoon.age - 1 : birthYear;
  const endYear = nextDaewoon ? birthYear + nextDaewoon.age - 2 : startYear + 9;
  const reversedAnnualFortunes = day.annualFortunes
    .filter((item) => item.year >= startYear && item.year <= endYear)
    .reverse();

  return (
    <Section title="대운과 세운">
      <div>
        <h4 className="text-lg font-bold">대운</h4>
        <div className="mt-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-4">{reversedDaewoon.map((item) => (
          <FortuneColumn
            key={item.index}
            item={item}
            selected={item.index === selectedDaewoon?.index}
            onSelect={() => setSelectedIndex(item.index)}
          />
        ))}</div>
      </div>
      <div className="mt-8 border-t pt-6">
        <h4 className="text-lg font-bold">
          세운 <span className="ml-1 text-sm font-normal text-muted-foreground">{startYear}~{endYear}년</span>
        </h4>
        <div className="mt-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-4">{reversedAnnualFortunes.map((item) => <FortuneColumn key={item.year} item={item} />)}</div>
      </div>
    </Section>
  );
}

function Interpretation({ day, open }: { day: LuckyDay; open: boolean }) {
  const dayPillarProfile = getDayPillarProfile(day.dayPillar);
  const integratedReport = React.useMemo(() => buildIntegratedSajuReport(day), [day]);
  const localSections = React.useMemo(() => buildFriendlySajuSections(day), [day]);
  const [sections, setSections] = React.useState<FriendlyReportSection[]>(() => localSections);
  const [openSectionId, setOpenSectionId] = React.useState(localSections[0]?.id ?? "");
  const [source, setSource] = React.useState<"local" | "gpt-5.5" | "loading">("local");

  React.useEffect(() => {
    setSections(localSections);
    setOpenSectionId(localSections[0]?.id ?? "");
    const endpoint = process.env.NEXT_PUBLIC_SAJU_REPORT_API_URL;
    if (!open || !endpoint) {
      setSource("local");
      return;
    }
    const controller = new AbortController();
    setSource("loading");
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.5",
        report: {
          pillars: day.pillars,
          dayPillar: day.dayPillar,
          dayPillarProfile,
          monthBranchSipsin: day.pillars[2].branchSipsin,
          elementQi: day.elementQi.percentages,
          strength: day.strength,
          yongshin: day.yongshin,
          daewoon: day.daewoon.slice(0, 8),
          knowledge: {
            context: integratedReport.knowledge.context,
            matchedRules: [
              ...integratedReport.knowledge.theme1,
              ...integratedReport.knowledge.theme2,
              ...integratedReport.knowledge.theme3,
            ],
          },
          daewoonAnalysis: integratedReport.daewoon,
        },
        output: {
          strategyVersion: "strategy_saju_explain.v1",
          language: "ko",
          audience: "parents expecting this baby; describe the child's temperament and life tendencies",
          style: "plain, warm Korean for non-experts; use cautious possibility language; never use internal codes or unexplained terms such as SI, gido, yongshin, gyeokguk or daewoon",
          title: "10-55 Korean characters; state an observable child trait or useful parenting implication; never use a landscape, natural object, or traditional symbolic image as the title",
          sections: "return 10 items with id, icon, a chart-specific title, and exactly 2 readable paragraphs totaling 180-700 Korean characters and at least 4 sentences",
          contentStructure: "for every section connect chart evidence to interpretation, then add a concrete home/school/play simulation, an observable sign, and an action or question parents can try; do not pad with decorative prose",
          examples: "prefer clearly labeled hypothetical child scenarios and comparisons with the same dominant pattern; use a celebrity only when birth date and time and the exact relevant chart structure are verified, cited, and presented as an analogy rather than proof",
        },
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Report API ${response.status}`);
        return response.json() as Promise<{ sections?: Array<Partial<FriendlyReportSection>> }>;
      })
      .then((report) => {
        const generatedSections = report.sections
          ?.filter((section) => typeof section.title === "string" && typeof section.body === "string")
          .map((section, index) => ({
            id: `${section.id || "section"}-${index + 1}`,
            icon: typeof section.icon === "string" && Object.hasOwn(FRIENDLY_SECTION_ICON, section.icon)
              ? section.icon as FriendlySectionIcon
              : localSections[index]?.icon ?? "sparkles",
            title: sanitizeFriendlySajuText(section.title as string),
            body: sanitizeFriendlySajuText(section.body as string),
          }));
        if (generatedSections && evaluateFriendlySajuSections(generatedSections, day).accepted) {
          setSections(generatedSections);
          setSource("gpt-5.5");
        } else {
          setSource("local");
        }
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setSource("local");
      });
    return () => controller.abort();
  }, [day, integratedReport, localSections, open]);

  return (
    <Section title="사주 해석">
      <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" />
        {source === "gpt-5.5" ? "GPT-5.5 해석" : source === "loading" ? "GPT-5.5 해석 생성 중…" : "기본 해설"}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {sections.map((section, index) => {
          const expanded = section.id === openSectionId;
          const Icon = FRIENDLY_SECTION_ICON[section.icon];
          const contentId = `saju-section-${section.id}`;
          return (
            <article key={section.id} className={cn(index > 0 && "border-t border-border")}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={contentId}
                onClick={() => setOpenSectionId(expanded ? "" : section.id)}
                className="flex w-full items-center gap-3 px-3 py-4 text-left transition-colors hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5"
              >
                <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm font-semibold leading-6 text-foreground sm:text-base">
                  {section.title}
                </span>
                <ChevronDown
                  className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              {expanded && (
                <div id={contentId} className="border-t border-border/70 bg-card px-4 py-5 sm:px-12 sm:py-6">
                  <div className="space-y-3 text-sm leading-7 text-foreground/80 sm:text-[15px]">
                    {section.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  {index === 0 && dayPillarProfile && (
                    <a
                      href={dayPillarProfile.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      참고 자료 보기
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}

export function LuckyDayDetailDialog({ day, open, onOpenChange }: LuckyDayDetailDialogProps) {
  if (!day) return null;
  const dateObj = new Date(`${day.date}T00:00:00`);
  const correctionSign = day.timeCorrection.correctionMinutes > 0 ? "+" : "";
  const adjustedTime = `${String(day.timeCorrection.adjustedHour).padStart(2, "0")}:${String(day.timeCorrection.adjustedMinute).padStart(2, "0")}`;
  const locationLabel = day.location.matched ? day.location.label : `${day.location.input} 입력, ${day.location.label} 기준`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-0.75rem)] w-[calc(100vw-0.75rem)] min-w-0 max-w-none overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-card p-0 shadow-[0_12px_32px_rgba(36,30,34,0.15),0_2px_6px_rgba(36,30,34,0.08)] sm:max-h-[94vh] sm:w-full sm:max-w-[68.75rem] sm:rounded-xl">
        <div className="min-w-0 space-y-4 p-2.5 pt-12 sm:space-y-5 sm:p-8">
          <DialogHeader className="items-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="rounded bg-gold-soft px-3 py-2 font-mono text-[10px] tracking-wider text-primary" variant="secondary">Rank {day.rank}</Badge>
              <Badge className="rounded border border-border bg-background px-3 py-2 font-mono text-[10px] tracking-wide text-primary" variant="secondary">Score {day.score.toFixed(1)}</Badge>
            </div>
            <DialogTitle className="pt-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl">상세 사주 리포트</DialogTitle>
            <DialogDescription>{format(dateObj, "yyyy년 M월 d일 (EEE)", { locale: ko })} · {day.timeLabel}</DialogDescription>
            <p className="text-xs leading-5 text-muted-foreground">
              {day.gender === "M" ? "남아" : "여아"} · {locationLabel} · 출생지 위치 기준 {correctionSign}{day.timeCorrection.correctionMinutes}분 조정 · 보정 계산시각 {day.timeCorrection.adjustedDate} {adjustedTime}
            </p>
            {day.scoring.capped && (
              <p className="rounded bg-gold-soft px-3 py-1 text-[11px] text-primary">산식 원점수 {day.scoring.rawScore.toFixed(2)}점을 기준에 따라 100점으로 제한했습니다.</p>
            )}
          </DialogHeader>

          <SajuTable day={day} />
          <Interpretation day={day} open={open} />
          <ElementPentagon day={day} />
          <StarsTable day={day} />
          <Yongshin day={day} />
          <StrengthChart day={day} />
          <FortuneFlow day={day} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
