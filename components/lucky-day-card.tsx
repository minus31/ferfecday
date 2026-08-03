"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LuckyDay } from "@/lib/lucky-day-types";

interface LuckyDayCardProps {
  day: LuckyDay;
  featured?: boolean;
  onClick?: () => void;
}

type ContributionKey = "base" | "sipseong" | "unseong" | "stars";

const CONTRIBUTION_META: Record<
  ContributionKey,
  { label: string; color: string }
> = {
  base: { label: "신강신약 Base", color: "bg-emerald-500" },
  sipseong: { label: "십성 격국", color: "bg-violet-500" },
  unseong: { label: "운성·신살", color: "bg-sky-500" },
  stars: { label: "길흉 가감", color: "bg-amber-500" },
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getContributions(day: LuckyDay) {
  const sipseong = day.scoring.details
    .filter((detail) => detail.label.startsWith("10장"))
    .reduce((sum, detail) => sum + detail.value, 0);
  const unseong = day.scoring.details
    .filter((detail) => detail.label.startsWith("11장"))
    .reduce((sum, detail) => sum + detail.value, 0);
  const stars = day.scoring.details
    .filter((detail) => detail.label.startsWith("12장"))
    .reduce((sum, detail) => sum + detail.value, 0);

  return {
    base: clampPercent(day.strength.baseScore),
    sipseong: clampPercent(80 + sipseong * 5),
    unseong: clampPercent(80 + unseong * 12),
    stars: clampPercent(80 + stars * 8),
  } satisfies Record<ContributionKey, number>;
}

function formatDateTime(day: LuckyDay) {
  const dateObj = new Date(`${day.date}T00:00:00`);
  const locationLabel = day.location.matched
    ? day.location.label
    : `${day.location.input}(${day.location.label} 기준)`;
  return `${format(dateObj, "yyyy.MM.dd (EEE)", { locale: ko })} · ${day.timeLabel} · ${locationLabel}`;
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

function ScoreContributionBars({ day }: { day: LuckyDay }) {
  const contributions = getContributions(day);

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-border/70 bg-secondary/40 p-4">
      <p className="text-sm font-medium text-muted-foreground">
        평가 요소별 밸런스 분석 (Score Contribution)
      </p>
      <div className="space-y-3">
        {(Object.keys(CONTRIBUTION_META) as ContributionKey[]).map((key) => {
          const meta = CONTRIBUTION_META[key];
          const value = contributions[key];

          return (
            <div
              key={key}
              className="grid items-center gap-2 text-sm sm:grid-cols-[13rem_minmax(0,1fr)_3rem]"
            >
              <p className="font-medium">{meta.label}</p>
              <div className="h-3 overflow-hidden rounded-full bg-background/90">
                <div className={cn("h-full", meta.color)} style={{ width: `${value}%` }} />
              </div>
              <p className="text-right font-medium text-muted-foreground">{value}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LuckyDayCard({
  day,
  featured = false,
  onClick,
}: LuckyDayCardProps) {
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
            원점수 {day.scoring.rawScore.toFixed(2)} · 평가 기준에 따라 100점 상한 적용
          </p>
        )}

        <div className="rounded-[1rem] border border-dashed border-primary/25 bg-primary/5 px-4 py-4">
          <p className="text-xs font-semibold text-primary">한줄 요약</p>
          <p className="mt-1 text-sm text-muted-foreground">해당 날짜의 핵심 해석이 여기에 제공될 예정입니다.</p>
        </div>

        {featured && <ScoreContributionBars day={day} />}

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
