"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Compass, HeartHandshake, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { LocationCombobox } from "@/components/location-combobox";
import { SiteHeader } from "@/components/site-header";
import {
  DEFAULT_BIRTH_GENDER,
  DEFAULT_BIRTH_LOCATION_ID,
  getBirthLocation,
  type BirthGender,
  type BirthLocation,
} from "@/lib/birth-options";

const highlights = [
  { label: "상위 10개 후보", icon: Star },
  { label: "사주 기반 해설", icon: Compass },
  { label: "출산 지역 보정", icon: HeartHandshake },
];

export default function HomePage() {
  const router = useRouter();
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [gender, setGender] = React.useState<BirthGender>(DEFAULT_BIRTH_GENDER);
  const [location, setLocation] = React.useState<BirthLocation | null>(
    () => getBirthLocation(DEFAULT_BIRTH_LOCATION_ID)
  );

  const canSubmit = Boolean(range?.from && range?.to && location);

  const handleSubmit = () => {
    if (!range?.from || !range?.to || !location) return;
    const params = new URLSearchParams({
      from: format(range.from, "yyyy-MM-dd"),
      to: format(range.to, "yyyy-MM-dd"),
      gender,
      location: location.id,
    });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="page-shell flex-1 items-center justify-center py-8 sm:py-10 lg:py-16">
        <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="eyebrow">
              <Sparkles className="size-3.5" />
              생일선물 · BirthdayGift
            </div>
            <div className="mt-6 space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                우리 아이의
                <br />
                <span className="text-primary">가장 좋은 날</span>을 찾아드려요
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                출산 예정 기간을 입력하면, 사주 데이터와 지역 보정을 바탕으로
                가장 안정적인 길일 후보를 깔끔하게 정리해 드립니다.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="soft-panel flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-5 sm:p-7">
            <div className="space-y-5">
              <DateRangePicker value={range} onChange={setRange} />

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">성별</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "M" as const, label: "남아" },
                    { value: "F" as const, label: "여아" },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={gender === item.value ? "default" : "outline"}
                      size="lg"
                      onClick={() => setGender(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">출산 지역</p>
                <LocationCombobox value={location} onChange={setLocation} />
                <p className="text-xs leading-5 text-muted-foreground">
                  검색 결과에서 지역을 선택해 주세요. 선택한 지역의 내부 좌표로 동경 135도 기준시와의 경도 차이를 보정합니다.
                </p>
              </div>

              <Button
                size="xl"
                className="w-full"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                길일 찾기
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
