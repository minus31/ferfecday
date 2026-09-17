"use client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayPillarPortrait } from "@/components/day-pillar-portrait";
import type { LuckyDay } from "@/lib/lucky-day-types";
import { buildProductSummary } from "@/lib/saju/product-report";
export function LuckyDayCard({
  day,
  searchId,
  featured,
  onClick,
}: {
  day: LuckyDay;
  searchId: string;
  featured?: boolean;
  onClick?: () => void;
}) {
  const correction = day.timeCorrection.correctionMinutes;
  return (
    <article
      className={`surface-card space-y-5 p-5 sm:p-6 ${featured ? "border-primary/30 bg-gradient-to-br from-amber-50/70 to-white" : ""}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        <DayPillarPortrait
          searchId={searchId}
          candidateId={day.id}
          pillar={day.dayPillar}
          label={day.dayPillarHangul}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-semibold text-primary">
            Rank {day.rank}
            {featured ? ", 가장 먼저 살펴볼 후보" : ""}
          </p>
          <h3 className="text-xl font-semibold">
            {format(new Date(`${day.date}T00:00:00`), "yyyy.MM.dd (EEE)", {
              locale: ko,
            })}
            <span className="mt-1 block text-lg">{day.timeLabel}</span>
          </h3>
          <p className="text-sm">
            {day.location.label}, {day.dayPillarHangul}({day.dayPillar})
          </p>
          <p className="text-xs leading-6 text-muted-foreground">
            출생지 위치 기준 {correction > 0 ? "+" : ""}
            {correction}분 보정. 위 시간대는 보정치를 반영한 실제 한국
            표준시입니다.
          </p>
          <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm">
            대운 평균 기본 점수{" "}
            <strong className="ml-2 text-lg text-primary">
              {day.scoring.breakdown.daewoonAverageBaseScore.toFixed(1)}점
            </strong>
          </p>
        </div>
      </div>
      <div className="space-y-3 border-t pt-4">
        <h4 className="text-sm font-semibold">
          우리 아이는 어떤 모습으로 자랄까요?
        </h4>
        <p className="whitespace-pre-line text-sm leading-7 text-foreground/80">
          {buildProductSummary(day)}
        </p>
      </div>
      <div className="flex justify-end">
        <Button onClick={onClick}>
          상세 보고서 보기 <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  );
}
