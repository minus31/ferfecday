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
import type { LuckyDay, LuckyDaysResponse } from "@/lib/lucky-day-types";

function formatDateLabel(date: string) {
  return format(new Date(`${date}T00:00:00`), "yyyy.MM.dd", { locale: ko });
}

function ResultsContent() {
  const params = useSearchParams();
  const from = params.get("from");
  const to = params.get("to");

  const [days, setDays] = React.useState<LuckyDay[]>([]);
  const [candidateCount, setCandidateCount] = React.useState(0);
  const [selected, setSelected] = React.useState<LuckyDay | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadLuckyDays() {
      if (!from || !to) {
        setError("날짜 범위를 다시 선택해주세요.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lucky-days?from=${from}&to=${to}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("길일 계산에 실패했습니다.");
        }

        const data = (await response.json()) as LuckyDaysResponse;
        setDays(data.results);
        setCandidateCount(data.candidates);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "길일 계산에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadLuckyDays();

    return () => controller.abort();
  }, [from, to]);

  const rangeLabel =
    from && to ? `${formatDateLabel(from)} → ${formatDateLabel(to)}` : "선택된 기간";

  const handleSelect = (day: LuckyDay) => {
    setSelected(day);
    setDialogOpen(true);
  };

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft />
              다시 선택하기
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{rangeLabel}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              우리 아이를 위한 길일 Top 10
            </h1>
            <p className="text-sm text-muted-foreground">
              기간 내 날짜와 시간대별 사주를 계산해 길일 점수순으로 정렬했습니다.
            </p>
          </div>
        </div>

        {loading && (
          <section className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg border bg-secondary"
              />
            ))}
          </section>
        )}

        {!loading && error && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </section>
        )}

        {!loading && !error && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Best 1 ~ 10</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {candidateCount}개 후보 평가
              </p>
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
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
            <div className="h-28 animate-pulse rounded-lg border bg-secondary" />
          </main>
        }
      >
        <ResultsContent />
      </React.Suspense>
    </div>
  );
}
