"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { LuckyDay } from "@/lib/lucky-day-types";

interface LuckyDayCardProps {
  day: LuckyDay;
  featured?: boolean;
  onClick?: () => void;
}

export function LuckyDayCard({
  day,
  featured = false,
  onClick,
}: LuckyDayCardProps) {
  const dateObj = new Date(`${day.date}T00:00:00`);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "relative cursor-pointer overflow-hidden transition-shadow hover:shadow-lg",
        featured && "border-primary/40 bg-gradient-to-br from-primary/5 to-transparent"
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={featured ? "default" : "secondary"}>
              {featured && <Sparkles className="mr-1 size-3" />}
              Best {day.rank}
            </Badge>
            <Badge variant="outline">점수 {day.score}</Badge>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-semibold">
              {format(dateObj, "M월 d일 (EEE)", { locale: ko })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(dateObj, "yyyy년", { locale: ko })} · {day.timeLabel}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">일주</p>
          <p className="font-semibold">{day.dayPillarHangul}</p>
          <p className="text-xs text-muted-foreground">{day.dayPillar}</p>
        </div>
      </CardContent>
    </Card>
  );
}
