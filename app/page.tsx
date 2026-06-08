"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  const router = useRouter();
  const [range, setRange] = React.useState<DateRange | undefined>();

  const canSubmit = Boolean(range?.from && range?.to);

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      from: format(range.from, "yyyy-MM-dd"),
      to: format(range.to, "yyyy-MM-dd"),
    });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
        <section className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="size-3.5" />
            사주 기반 출생 택일
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            우리 아이의
            <br />
            <span className="text-primary">가장 좋은 날</span>을 찾아드려요
          </h1>
          <p className="max-w-md text-balance text-muted-foreground">
            출산 예정 기간을 선택하면, 사주에 근거한 길일을
            점수와 함께 카드로 보여드립니다.
          </p>
        </section>

        <section className="w-full max-w-md space-y-4">
          <DateRangePicker value={range} onChange={setRange} />
          <Button
            size="xl"
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            길일 찾기
          </Button>
        </section>
      </main>
    </div>
  );
}
