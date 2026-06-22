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

type ContributionKey = "elements" | "sipseong" | "sinsal" | "daewoon";

const CONTRIBUTION_META: Record<
  ContributionKey,
  { label: string; color: string }
> = {
  elements: { label: "오행 균형 (Elements)", color: "bg-green-500" },
  sipseong: { label: "십성 격국 (Sipseong)", color: "bg-violet-500" },
  sinsal: { label: "길성 신살 (Sinsal)", color: "bg-orange-500" },
  daewoon: { label: "대운 흐름 (Daewoon)", color: "bg-blue-500" },
};

function getScoreDetail(day: LuckyDay, label: string) {
  return day.scoring.details.find((detail) => detail.label === label)?.value ?? 0;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getContributions(day: LuckyDay) {
  const elements = getScoreDetail(day, "오행 균형");
  const sipseong = getScoreDetail(day, "십성 다양성");
  const sinsal = getScoreDetail(day, "길성/신살");
  const firstDaewoon = day.daewoon[0];
  const daewoonBase =
    (firstDaewoon?.isGongmang ? -8 : 0) +
    (["長生", "冠帶", "建祿", "帝旺", "養"].includes(firstDaewoon?.unseong ?? "")
      ? 8
      : 0);

  return {
    elements: clampPercent(70 + elements * 2),
    sipseong: clampPercent(72 + sipseong * 3),
    sinsal: clampPercent(72 + sinsal * 2),
    daewoon: clampPercent(86 + daewoonBase),
  } satisfies Record<ContributionKey, number>;
}

function formatDateTime(day: LuckyDay) {
  const dateObj = new Date(`${day.date}T00:00:00`);
  return `${format(dateObj, "yyyy.MM.dd (EEE)", { locale: ko })} · ${day.timeLabel}`;
}

function getFeatureTags(day: LuckyDay) {
  const tags: string[] = [];
  const elementValues = day.elementQi.percentages;
  const maxElement = Object.entries(elementValues).sort((a, b) => b[1] - a[1])[0]?.[0];
  const minElement = Object.entries(elementValues).sort((a, b) => a[1] - b[1])[0]?.[0];

  const elementKo: Record<string, string> = {
    tree: "목",
    fire: "화",
    earth: "토",
    metal: "금",
    water: "수",
  };

  if (day.score >= 90) tags.push("상위 균형");
  else if (day.score >= 80) tags.push("우수 후보");
  else tags.push("보완 후보");

  if (day.specialSals.cheonul.length > 0) tags.push("천을귀인");
  else if (day.specialSals.munchang.length > 0) tags.push("문창귀인");
  else if (day.specialSals.geumyeo.length > 0) tags.push("금여록");
  else if (maxElement) tags.push(`${elementKo[maxElement]} 기운 강세`);

  if (day.specialSals.cheonduk.length > 0 || day.specialSals.wolduk.length > 0) {
    tags.push("천월덕 보유");
  } else if (day.gongmang.pillarIndices.length === 0) {
    tags.push("공망 안정");
  } else if (minElement) {
    tags.push(`${elementKo[minElement]} 보완 필요`);
  }

  return tags.slice(0, 3);
}

function ScoreCircle({ score, muted = false }: { score: number; muted?: boolean }) {
  return (
    <div
      className={cn(
        "flex size-24 shrink-0 flex-col items-center justify-center rounded-full text-center sm:size-32",
        muted ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
      )}
    >
      <span className="text-[10px] uppercase tracking-wide opacity-70">Score</span>
      <span className="mt-1 text-xl font-semibold sm:text-2xl">{score.toFixed(1)}</span>
    </div>
  );
}

function ScoreContributionBars({ day }: { day: LuckyDay }) {
  const contributions = getContributions(day);

  return (
    <div className="space-y-4 border-t pt-5">
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
              <div className="h-3 overflow-hidden rounded-sm bg-secondary">
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
  const tags = getFeatureTags(day);

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg shadow-sm",
        featured
          ? "border-2 border-amber-400 bg-amber-50/25"
          : "border-border bg-card"
      )}
    >
      <CardContent className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-5">
            <Badge
              variant={featured ? "default" : "secondary"}
              className={cn(
                "h-10 min-w-36 justify-center rounded-md uppercase",
                featured && "bg-amber-400 text-foreground hover:bg-amber-400"
              )}
            >
              {featured && <Sparkles className="mr-1 size-3" />}
              Rank {day.rank}
              {featured ? " (Best)" : ""}
            </Badge>

            <div className="space-y-1">
              <p className="text-xl font-semibold tracking-tight">
                {formatDateTime(day)}
              </p>
              <p className="text-sm text-muted-foreground">
                일주 {day.dayPillarHangul}({day.dayPillar})
              </p>
            </div>
          </div>

          <ScoreCircle score={day.score} muted={!featured} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {tags.map((tag) => (
            <div
              key={tag}
              className="rounded-md border bg-secondary/70 px-3 py-3 text-center text-sm font-medium"
            >
              {tag}
            </div>
          ))}
        </div>

        {featured && <ScoreContributionBars day={day} />}

        <div className="flex justify-end border-t pt-4">
          <Button onClick={onClick} size="sm" className="min-w-36">
            Detail Report
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
