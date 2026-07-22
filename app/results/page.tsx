"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { LuckyDayCard } from "@/components/lucky-day-card";
import { LuckyDayDetailDialog } from "@/components/lucky-day-detail-dialog";
import type { LuckyDay } from "@/lib/lucky-day-types";
import { getBirthLocation, parseBirthGender } from "@/lib/birth-options";
import { calculateLuckyDays } from "@/lib/lucky-days";

function formatDateLabel(date: string) {
  return format(new Date(`${date}T00:00:00`), "yyyy.MM.dd", { locale: ko });
}

function ResultsContent() {
  const params = useSearchParams();
  const from = params.get("from");
  const to = params.get("to");
  const gender = parseBirthGender(params.get("gender"));
  const locationInput = params.get("location") ?? "";
  const location = getBirthLocation(locationInput);

  const [days, setDays] = React.useState<LuckyDay[]>([]);
  const [candidateCount, setCandidateCount] = React.useState(0);
  const [selected, setSelected] = React.useState<LuckyDay | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadLuckyDays() {
      if (!from || !to) {
        setError("날짜 범위를 다시 선택해주세요.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 0);
        });
        const data = calculateLuckyDays({
          from,
          to,
          gender,
          location: locationInput || location.label,
        });
        setDays(data.results);
        setCandidateCount(data.candidates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "길일 계산에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadLuckyDays();
  }, [from, to, gender, location.id, location.label, locationInput]);

  const rangeLabel =
    from && to ? `${formatDateLabel(from)} → ${formatDateLabel(to)}` : "선택된 기간";
  const genderLabel = gender === "M" ? "남아" : "여아";
  const locationLabel = location.matched
    ? location.label
    : `${locationInput || location.label}(${location.label} 기준)`;

  const handleSelect = (day: LuckyDay) => {
    setSelected(day);
    setDialogOpen(true);
  };

  return (
    <>
      <main className="page-shell flex-1 space-y-6 py-8 sm:py-10">
        <section className="surface-card overflow-hidden p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" asChild className="rounded-full px-3">
                <Link href="/">
                  <ArrowLeft />
                  다시 선택하기
                </Link>
              </Button>
              <div className="space-y-3">
                <div className="eyebrow">
                  <Sparkles className="size-3.5" />
                  Best Birthdays
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    가장 좋은 날을 골랐어요
                  </h1>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                    예정 기간 내 전수 연산 결과를 점수 기준으로 정리해 드립니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="soft-panel w-full max-w-xl space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {rangeLabel}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {genderLabel}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {locationLabel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {candidateCount}개 후보를 평가했고, 상위 3개 결과를 보여드립니다.
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <section className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[1.25rem] border border-border/70 bg-secondary/60" />
            ))}
          </section>
        )}

        {!loading && error && (
          <section className="surface-card border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </section>
        )}

        {!loading && !error && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Best 3</h2>
              <p className="text-xs text-muted-foreground">{candidateCount}개 후보 평가</p>
            </div>

            <div className="space-y-3">
              {days.map((day) => (
                <LuckyDayCard
                  key={day.id}
                  day={day}
                  featured={day.rank === 1}
                  onClick={() => handleSelect(day)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <LuckyDayDetailDialog
        day={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <React.Suspense
        fallback={
          <main className="page-shell flex-1 py-8 sm:py-10">
            <div className="h-28 animate-pulse rounded-[1.25rem] border border-border/70 bg-secondary/60" />
          </main>
        }
      >
        <ResultsContent />
      </React.Suspense>
    </div>
  );
}
