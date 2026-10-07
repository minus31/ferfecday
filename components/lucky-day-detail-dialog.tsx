"use client";
import * as React from "react";
import { LockKeyhole, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { serviceRequest } from "@/lib/supabase-browser";
import { REPORT_PRICE, type ReportView } from "@/lib/product";
import type { LuckyDay, LuckyPillar } from "@/lib/lucky-day-types";
import { strengthDescription } from "@/lib/saju/product-report";
import {
  getCharacterElement,
  getTenGodEvidence,
  readableCharacter,
} from "@/lib/saju/natal-evidence";
import { collectStars, sajuLabel } from "@/lib/saju/stars";
import { getDaewoonPeriod } from "@/lib/saju/daewoon-ai";
const ELEMENTS = {
  tree: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};
const COLORS = {
  tree: "#21734a",
  fire: "#ae3e4c",
  earth: "#976421",
  metal: "#535d68",
  water: "#315b94",
};
const GOD_MEANINGS: Record<string, string> = {
  비겁: "자기 기준과 협력",
  식상: "표현과 결과물",
  재성: "자원과 현실 감각",
  관성: "기준과 책임",
  인성: "배움과 수용",
};
const ROLE_QI_KEYS = {
  비겁: "bigeop",
  식상: "siksang",
  재성: "jaeseong",
  관성: "gwanseong",
  인성: "insung",
} as const;
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Paragraphs({ body }: { body: string }) {
  return (
    <div className="space-y-4 text-sm leading-8 text-foreground/85 sm:text-[15px]">
      {body.split(/\n\s*\n/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
function SajuTable({ day }: { day: LuckyDay }) {
  const rows: Array<[string, (p: LuckyPillar) => string]> = [
    ["천간", (p) => p.stem],
    ["십성", (p) => sajuLabel(p.stemSipsin)],
    ["지지", (p) => p.branch],
    ["십성", (p) => sajuLabel(p.branchSipsin)],
    ["지장간", (p) => p.jigang],
    ["12운성", (p) => sajuLabel(p.unseong)],
    ["12신살", (p) => sajuLabel(p.sinsal)],
  ];
  const colored = (value: string, label: string) => (
    <span className="inline-flex flex-wrap justify-center gap-1">
      {[...value]
        .filter((char) => !/\s/.test(char))
        .map((char, index) => {
          const element = getCharacterElement(char);
          return (
            <span
              key={`${char}-${index}`}
              className="inline-block rounded-md px-1 py-0.5"
              style={element ? { color: COLORS[element] } : undefined}
              aria-label={
                element ? `${label} ${char}, ${ELEMENTS[element]}` : undefined
              }
              title={element ? `${char}, ${ELEMENTS[element]}` : undefined}
            >
              {char}
            </span>
          );
        })}
    </span>
  );
  return (
    <Section title="사주 원국">
      <table className="w-full table-fixed border-collapse text-center text-xs sm:text-sm">
        <caption className="sr-only">
          시주, 일주, 월주, 년주별 사주 구성
        </caption>
        <thead>
          <tr>
            <th className="w-14 border p-2">구분</th>
            {day.pillars.map((p) => (
              <th key={p.name} className="border bg-secondary/40 p-2">
                {p.name}
                <span className="mt-1 block font-normal text-muted-foreground">
                  {p.ganziHangul}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, render], index) => (
            <tr key={`${label}-${index}`}>
              <th className="border bg-secondary/30 p-2 font-medium">
                {label}
              </th>
              {day.pillars.map((p) => (
                <td
                  key={p.name}
                  className={`break-words border px-1 py-3 ${label === "천간" || label === "지지" ? "text-2xl font-bold sm:text-3xl" : ""}`}
                >
                  {["천간", "지지", "지장간"].includes(label)
                    ? colored(render(p), `${p.name} ${label}`)
                    : render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        글자색은 오행을 뜻합니다:{" "}
        {Object.entries(ELEMENTS).map(([key, name], index) => (
          <React.Fragment key={key}>
            {index > 0 ? ", " : ""}
            <span style={{ color: COLORS[key as keyof typeof COLORS] }}>
              {name}
            </span>
          </React.Fragment>
        ))}
        . 지장간은 각 지지 안에 있는 천간입니다.
      </p>
    </Section>
  );
}
function Elements({ day }: { day: LuckyDay }) {
  const keys = Object.keys(ELEMENTS) as Array<keyof typeof ELEMENTS>;
  const points = keys.map((key, i) => {
    const angle = ((-90 + i * 72) * Math.PI) / 180;
    return { key, x: 50 + 28 * Math.cos(angle), y: 50 + 28 * Math.sin(angle) };
  });
  const data = points
    .map(({ key, x, y }) => {
      const size = Math.max(
        0,
        Math.min(1, day.elementQi.percentages[key] / 40),
      );
      return `${50 + (x - 50) * size},${50 + (y - 50) * size}`;
    })
    .join(" ");
  const gods = getTenGodEvidence(day);
  const rankedRoles = Object.values(ROLE_QI_KEYS).sort(
    (left, right) =>
      day.strength.roleQi[right].percentage -
      day.strength.roleQi[left].percentage,
  );
  const roleWeight = (name: string) => {
    const key = ROLE_QI_KEYS[name as keyof typeof ROLE_QI_KEYS];
    const value = day.strength.roleQi[key].percentage;
    const rank = rankedRoles.indexOf(key);
    return value === 0
      ? "역할 비중이 거의 없음"
      : rank < 2
        ? "상대적으로 앞서는 역할"
        : rank === 2
          ? "중간 정도의 역할"
          : "비교적 조용한 역할";
  };
  return (
    <Section title="오행의 어우러짐">
      <div className="grid items-center gap-4 sm:grid-cols-2">
        <svg
          viewBox="0 0 100 100"
          className="mx-auto w-full max-w-xs"
          role="img"
          aria-label="다섯 오행의 상대적인 강약"
        >
          <title>오행의 상대적인 강약과 네 단계 오각형 눈금</title>
          {[0.25, 0.5, 0.75, 1].map((size) => (
            <polygon
              key={size}
              data-testid="element-grid-ring"
              points={points
                .map(
                  (p) => `${50 + (p.x - 50) * size},${50 + (p.y - 50) * size}`,
                )
                .join(" ")}
              fill="none"
              stroke="#a8a29e"
              strokeOpacity={size === 1 ? 0.8 : 0.55}
              strokeWidth={size === 1 ? 0.8 : 0.5}
            />
          ))}
          {points.map((p) => (
            <line
              key={p.key}
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke="#a8a29e"
              strokeOpacity=".55"
              strokeWidth=".5"
            />
          ))}
          <polygon
            data-testid="element-data-polygon"
            points={data}
            fill="rgba(110,59,99,.12)"
            stroke="#6e3b63"
            strokeWidth=".7"
          />
          {points.map((p) => (
            <text
              key={p.key}
              x={50 + (p.x - 50) * 1.35}
              y={51 + (p.y - 50) * 1.35}
              fill={COLORS[p.key]}
              textAnchor="middle"
              fontSize="5"
            >
              {ELEMENTS[p.key]}
            </text>
          ))}
        </svg>
        <div className="space-y-3 text-sm leading-7">
          <p>
            오각형은 목, 화, 토, 금, 수의 상대적인 배치를 보여줍니다. 안쪽의
            눈금은 비교를 돕기 위한 것이며 점수는 아닙니다.
          </p>
          <p>
            일간 {readableCharacter(day.pillars[1].stem)}을 기준으로 각 기운이 어떤 역할을 하는지는
            아래 십성 구성에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3" aria-label="일간 기준 십성 구성">
        <h4 className="font-semibold">일간 기준 십성 구성</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {gods.map((group) => (
            <div
              key={group.name}
              className="rounded-xl border bg-secondary/20 p-4"
            >
              <h5 className="font-semibold">
                {group.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {GOD_MEANINGS[group.name]}
                </span>
              </h5>
              <p className="mt-1 text-xs text-muted-foreground">
                {roleWeight(group.name)}
              </p>
              <div className="mt-3 space-y-3 text-xs leading-5">
                {group.gods.map((god) => (
                  <div
                    key={god.name}
                    className="border-t pt-2 first:border-0 first:pt-0"
                  >
                    <strong className="block text-sm">{god.name}</strong>
                    <p className="mt-1">
                      겉글자:{" "}
                      {god.visible.length ? god.visible.join(", ") : "없음"}
                    </p>
                    <p>
                      지장간:{" "}
                      {god.hidden.length ? god.hidden.join(", ") : "없음"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          역할의 강약은 일간을 기준으로 오행 전체를 비교한 것이며, 아래 각
          십성의 존재 여부는 실제 글자의 위치입니다. 존재만으로 성격이나 운명을
          단정하지 않습니다.
        </p>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        오행은 기질의 서로 다른 쓰임을 살펴보는 전통적 분류입니다. 많고
        적음만으로 좋고 나쁨이나 건강을 판단하지 않습니다.
      </p>
    </Section>
  );
}
function Stars({ day }: { day: LuckyDay }) {
  const stars = collectStars(day);
  return (
    <Section title="신살과 길성">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {day.pillars.map((p, i) => (
          <div key={p.name} className="rounded-xl border p-3">
            <h4 className="mb-3 text-sm font-semibold">
              {p.name}, {p.ganziHangul}
            </h4>
            <ul className="space-y-2 text-xs leading-5">
              {stars.pillars[i].map((star) => (
                <li key={star}>{star}</li>
              ))}
              {!stars.pillars[i].length && <li>해당 없음</li>}
            </ul>
          </div>
        ))}
      </div>
      {stars.relations.length > 0 && (
        <div className="mt-4 rounded-xl bg-secondary/40 p-4">
          <h4 className="text-sm font-semibold">
            기둥 사이에서 함께 작용하는 관계
          </h4>
          <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            {stars.relations.map((relation) => (
              <li key={relation}>{relation}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        현재 계산 체계에서 확인된 신살, 길성, 공망과 지지 관계를 모두
        표시합니다. 원진, 귀문, 형, 충 같은 이름은 조율할 긴장을 상징하며 사고,
        질병, 불행의 예고가 아닙니다. 신살의 채택 범위는 명리 학파마다 다릅니다.
      </p>
    </Section>
  );
}
function FortuneFlow({
  day,
  report,
}: {
  day: LuckyDay;
  report: ReportView | null;
}) {
  const [selected, setSelected] = React.useState(day.daewoon[0]?.index || 1);
  const period = getDaewoonPeriod(day, selected);
  return (
    <Section title="대운과 세운">
      <p className="text-sm leading-7 text-muted-foreground">
        전체 대운의 해설은 보고서와 함께 한 번에 준비됩니다. 아래 연령을
        선택하면 해당 시기의 세운을 볼 수 있습니다.
      </p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-3">
        {day.daewoon.map((item) => (
          <button
            key={item.index}
            aria-pressed={selected === item.index}
            onClick={() => setSelected(item.index)}
            className={`w-24 shrink-0 rounded-xl border p-3 text-center ${selected === item.index ? "border-primary bg-primary/5" : ""}`}
          >
            <span className="block text-xs">{item.age}세부터</span>
            <strong className="my-2 block text-xl">{item.ganzi}</strong>
            <span className="block text-xs">{item.ganziHangul}</span>
            <span className="mt-2 block text-[11px] text-muted-foreground">
              {sajuLabel(item.stemSipsin)}, {sajuLabel(item.branchSipsin)}
              <br />
              {sajuLabel(item.unseong)}, {sajuLabel(item.sinsal)}
              {item.isGongmang ? ", 공망" : ""}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {report ? (
          report.periods.map((item) => (
            <details
              key={item.index}
              className="rounded-xl border p-4"
              open={item.index === selected}
            >
              <summary className="cursor-pointer text-sm font-semibold">
                {item.title}
              </summary>
              <div className="mt-4">
                <Paragraphs body={item.body} />
              </div>
            </details>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            전체 대운 해설을 함께 준비하고 있어요…
          </p>
        )}
      </div>
      {period && (
        <div className="mt-6 border-t pt-5">
          <h4 className="font-semibold">
            {period.yearRange[0]}~{period.yearRange[1]}년의 세운
          </h4>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
            {period.annualFortunes.map((item) => (
              <div
                key={item.year}
                className="w-24 shrink-0 rounded-xl bg-secondary/40 p-3 text-center text-xs leading-6"
              >
                <p>{item.year}년</p>
                <strong className="text-xl">{item.ganzi}</strong>
                <p>{item.ganziHangul}</p>
                <p>
                  {sajuLabel(item.stemSipsin)}, {sajuLabel(item.branchSipsin)}
                </p>
                <p>
                  {sajuLabel(item.unseong)}, {sajuLabel(item.sinsal)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
export function LuckyDayDetailDialog({
  day,
  searchId,
  open,
  onOpenChange,
}: {
  day: LuckyDay;
  searchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [report, setReport] = React.useState<ReportView | null>(null),
    [error, setError] = React.useState("");
  const [retry, setRetry] = React.useState(0),
    [checkout, setCheckout] = React.useState("");
  const [paying, setPaying] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    setError("");
    const load = async (attempt: number) => {
      try {
        const result = await serviceRequest<ReportView | { pending: true }>(
          "report",
          { searchId, candidateId: day.id },
          controller.signal,
        );
        if ("pending" in result) {
          if (attempt >= 75)
            throw new Error(
              "해설을 준비하는 데 시간이 더 필요합니다. 잠시 후 다시 열어 주세요.",
            );
          timer = setTimeout(() => void load(attempt + 1), 4000);
        } else setReport(result);
      } catch (error) {
        if (!controller.signal.aborted) setError((error as Error).message);
      }
    };
    void load(0);
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [open, searchId, day.id, retry]);
  async function pay() {
    setPaying(true);
    setCheckout("");
    try {
      const result = await serviceRequest<{ status: string; message?: string }>(
        "checkout",
        { searchId },
      );
      if (result.status === "unlocked") setRetry((value) => value + 1);
      else setCheckout(result.message || "결제 기능을 준비 중입니다.");
    } catch (error) {
      setCheckout((error as Error).message);
    } finally {
      setPaying(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94dvh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto overflow-x-hidden p-3 pt-12 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            아이의 가능성을 만나는 사주 보고서
          </DialogTitle>
          <DialogDescription>
            {day.date}, {day.timeLabel}, {day.location.label}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-primary">
          Rank {day.rank}, 대운 평균 기본 점수{" "}
          {day.scoring.breakdown.daewoonAverageBaseScore.toFixed(1)}점
        </p>
        <p className="text-xs leading-6 text-muted-foreground">
          표시 시간대는 지역 보정을 반영한 실제 한국 표준시입니다. 출산 일정은
          의료진과 상의해 주세요.
        </p>
        <SajuTable day={day} />
        <Section title="사주 해석">
          <p className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-4" />
            {report
              ? report.source === "ai"
                ? "AI 생성 맞춤 해설, 전통 사주를 바탕으로 한 참고 콘텐츠"
                : "사주 구성에 따른 기본 해설, AI 맞춤 해설 연결을 이용할 수 없어 기본 해설을 제공합니다"
              : "사주 해석과 전체 대운 해설을 한 번에 준비하고 있어요…"}
          </p>
          {error && (
            <div role="alert" className="mb-4 space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={() => setRetry((value) => value + 1)}
              >
                다시 불러오기
              </Button>
            </div>
          )}
          {report && (
            <div className="space-y-3">
              {report.sections.map((section, index) => (
                <details
                  key={section.id}
                  open={index === 0}
                  className="rounded-xl border p-4 sm:p-5"
                >
                  <summary className="cursor-pointer font-semibold leading-7">
                    {section.title}
                  </summary>
                  <div className="mt-5">
                    <Paragraphs body={section.body} />
                  </div>
                </details>
              ))}
              {!report.unlocked && (
                <>
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 text-center">
                    <LockKeyhole className="mx-auto mb-3 size-6 text-primary" />
                    <h4 className="font-semibold">
                      학업, 적성부터 성인이 된 이후의 삶까지
                    </h4>
                    <p className="my-3 text-sm leading-7 text-muted-foreground">
                      이 검색에 포함된 모든 후보의 12개 주제 해설을 함께
                      열어보세요. 한 번 열린 결과는 이전 결과 조회에서 다시 볼
                      수 있습니다.
                    </p>
                    <Button onClick={pay} disabled={paying}>
                      {paying
                        ? "확인 중…"
                        : `${REPORT_PRICE.toLocaleString("ko-KR")}원으로 전체 해설 열기`}
                    </Button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      결제 연결 준비 중, 현재는 실제로 청구되지 않습니다.
                    </p>
                    {checkout && (
                      <p role="status" className="mt-3 text-sm leading-6">
                        {checkout}
                      </p>
                    )}
                  </div>
                  {report.lockedSections.map((section) => (
                    <article key={section.id} className="rounded-xl border p-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <LockKeyhole className="size-4" />
                        {section.title}
                      </h4>
                      <div
                        aria-hidden="true"
                        className="mt-4 select-none space-y-2 blur-sm"
                      >
                        <div className="h-3 w-full rounded bg-muted-foreground/20" />
                        <div className="h-3 w-11/12 rounded bg-muted-foreground/20" />
                        <div className="h-3 w-3/4 rounded bg-muted-foreground/20" />
                      </div>
                      <p className="sr-only">
                        결제 후 열람할 수 있는 해설입니다.
                      </p>
                    </article>
                  ))}
                </>
              )}
            </div>
          )}
        </Section>
        <Elements day={day} />
        <Stars day={day} />
        <Section title="균형을 돕는 용신">
          <p className="font-semibold text-primary">
            {day.yongshin.method === "johu" ? "조후용신" : "억부용신"},{" "}
            {ELEMENTS[day.yongshin.element]} 기운
          </p>
          <p className="mt-3 text-sm leading-7">
            {day.yongshin.method === "johu"
              ? "태어난 계절의 치우침을 조절하는 방향을 먼저 살핍니다."
              : "스스로 버티는 힘과 바깥으로 쓰는 힘의 균형을 살핍니다."}{" "}
            용신은 부족한 숫자를 채우거나 정해진 색을 쓰면 운이 바뀐다는 뜻이
            아니라, 사주의 강점을 무리 없이 펼칠 환경을 이해하는 기준입니다.
          </p>
        </Section>
        <Section title="신강과 신약, 힘을 쓰는 방식">
          <p className="font-semibold text-primary">
            {day.strength.gradeLabel}
          </p>
          <p className="mt-3 text-sm leading-7">
            {strengthDescription(day)} 신강이 무조건 좋거나 신약이 나쁘다는
            의미는 아니며, 각자에게 편안한 도전과 지원의 정도가 다르다는
            관점으로 읽어주세요.
          </p>
        </Section>
        <FortuneFlow day={day} report={report} />
      </DialogContent>
    </Dialog>
  );
}
