"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LuckyDay } from "@/lib/lucky-day-types";
import { buildSelectionReview } from "@/lib/saju/integrated-report";

interface LuckyDayCardProps {
  day: LuckyDay;
  featured?: boolean;
  onClick?: () => void;
}

function formatDateTime(day: LuckyDay) {
  const dateObj = new Date(`${day.date}T00:00:00`);
  const locationLabel = day.location.matched
    ? day.location.label
    : `${day.location.input}(${day.location.label} 기준)`;
  return `${format(dateObj, "yyyy.MM.dd (EEE)", { locale: ko })}, ${day.timeLabel}, ${locationLabel}`;
}

function formatCorrectionNotice(day: LuckyDay) {
  const correction = day.timeCorrection.correctionMinutes;
  const signedCorrection = `${correction > 0 ? "+" : ""}${correction}`;
  return `출생지 위치 기준 ${signedCorrection}분 조정한 시각으로 계산`;
}

function ScoreCircle({ score, muted = false }: { score: number; muted?: boolean }) {
  return (
    <div
      className={cn(
        "flex size-24 shrink-0 flex-col items-center justify-center rounded-[1.25rem] border text-center sm:size-28",
        muted
          ? "border-border/70 bg-secondary/60 text-muted-foreground"
          : "border-primary/20 bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(76,29,149,0.18)]"
      )}
    >
      <span className="text-[10px] uppercase tracking-[0.24em] opacity-70">Score</span>
      <span className="mt-1 text-xl font-semibold sm:text-2xl">{score.toFixed(1)}</span>
    </div>
  );
}

function formatSignedScore(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}점`;
}

function ScoreBreakdown({ day }: { day: LuckyDay }) {
  const breakdown = day.scoring.breakdown;
  const rows = [
    {
      label: "오행의 균형",
      value: `${(breakdown.daewoonAverageBaseScore + breakdown.elementBalanceAdjustment).toFixed(1)}점`,
      description: `원국 ${breakdown.originalBaseScore.toFixed(1)}점, 대운 평균 ${breakdown.daewoonAverageBaseScore.toFixed(1)}점, 오행 가감 ${formatSignedScore(breakdown.elementBalanceAdjustment)}`,
    },
    { label: "십성, 구조", value: formatSignedScore(breakdown.sipseongStructure) },
    { label: "12운성, 12신살", value: formatSignedScore(breakdown.unseongSinsal) },
    { label: "길성, 흉살", value: formatSignedScore(breakdown.goodBadStars) },
  ];

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-border/70 bg-secondary/40 p-4">
      <p className="text-sm font-semibold text-foreground">점수 산출 근거</p>
      <div className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background/80 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <div>
              <p className="font-medium">{row.label}</p>
              {row.description && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{row.description}</p>
              )}
            </div>
            <p className="shrink-0 font-semibold text-primary">{row.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 text-sm">
        <p className="font-semibold">최종 점수</p>
        <p className="font-bold text-primary">
          {day.scoring.rawScore.toFixed(1)}점{day.scoring.capped ? `, 상한 적용 ${day.score.toFixed(1)}점` : ""}
        </p>
      </div>
    </div>
  );
}

export function LuckyDayCard({
  day,
  featured = false,
  onClick,
}: LuckyDayCardProps) {
  const review = buildSelectionReview(day);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-transform duration-200 hover:-translate-y-0.5",
        featured
          ? "border-primary/20 bg-gradient-to-br from-amber-50/70 via-white/90 to-primary/10"
          : "border-border/70 bg-card/90"
      )}
    >
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-4">
            <Badge
              variant={featured ? "default" : "secondary"}
              className={cn(
                "h-10 min-w-36 justify-center rounded-full uppercase",
                featured && "bg-amber-400 text-foreground hover:bg-amber-400"
              )}
            >
              {featured && <Sparkles className="mr-1 size-3" />}
              Rank {day.rank}
              {featured ? " (Best)" : ""}
            </Badge>

            <div className="space-y-1">
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {formatDateTime(day)}
              </p>
              <p className="text-sm text-muted-foreground">
                일주 {day.dayPillarHangul}({day.dayPillar})
              </p>
              <p className="text-[11px] leading-4 text-muted-foreground/80">
                {formatCorrectionNotice(day)}
              </p>
            </div>
          </div>

          <ScoreCircle score={day.score} muted={!featured} />
        </div>

        {day.scoring.capped && (
          <p className="-mt-3 text-right text-[11px] text-muted-foreground">
            원점수 {day.scoring.rawScore.toFixed(2)}, 평가 기준에 따라 100점 상한 적용
          </p>
        )}

        <div className="space-y-4 rounded-[1rem] border border-dashed border-primary/25 bg-primary/5 px-4 py-4">
          <div>
            <p className="text-xs font-semibold text-primary">택일에 관한 총평</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.balance}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-emerald-700">가점 항목</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {review.positiveItems.length > 0 ? review.positiveItems.map((item) => (
                  <span key={`${item.label}-${item.value}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-800">
                    {item.label} +{item.value.toFixed(1)}
                  </span>
                )) : <span className="text-xs text-muted-foreground">별도 가점 없음</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-700">감점 항목</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {review.negativeItems.length > 0 ? review.negativeItems.map((item) => (
                  <span key={`${item.label}-${item.value}`} className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] text-rose-800">
                    {item.label} {item.value.toFixed(1)}
                  </span>
                )) : <span className="text-xs text-muted-foreground">별도 감점 없음</span>}
              </div>
            </div>
          </div>
          <div className="border-t border-primary/10 pt-3">
            <p className="text-xs font-semibold text-primary">아이의 기질</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.temperament}</p>
          </div>
        </div>

        {featured && <ScoreBreakdown day={day} />}

        <div className="flex justify-end border-t border-border/70 pt-4">
          <Button onClick={onClick} size="sm" className="min-w-36">
            Detail Report
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
