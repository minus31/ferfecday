"use client";

import * as React from "react";
import { addDays, addYears, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MAX_RANGE_DAYS = 3;

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const today = startOfDay(new Date());

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range.to) {
      setOpen(false);
    }
    onChange(range);
  };

  const disabledDays =
    value?.from && !value.to
      ? [{ before: value.from }, { after: addDays(value.from, MAX_RANGE_DAYS - 1) }]
      : { before: today };

  const label = !value?.from
    ? "출산 예정 기간을 선택하세요"
    : value.to
      ? `${format(value.from, "yyyy.MM.dd", { locale: ko })} → ${format(value.to, "yyyy.MM.dd", { locale: ko })}`
      : `${format(value.from, "yyyy.MM.dd", { locale: ko })} → 종료일 선택`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="xl"
            className={cn(
              "h-14 w-full justify-start border-border/70 bg-white/80 px-4 text-left font-normal shadow-sm backdrop-blur",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4 text-primary" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] max-w-[22rem] p-0"
          align="center"
          collisionPadding={8}
        >
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            min={1}
            max={MAX_RANGE_DAYS - 1}
            resetOnSelect
            excludeDisabled
            numberOfMonths={1}
            defaultMonth={value?.from ?? today}
            startMonth={startOfMonth(today)}
            endMonth={endOfMonth(addYears(today, 2))}
            captionLayout="dropdown"
            navLayout="around"
            autoFocus
            locale={ko}
            disabled={disabledDays}
            labels={{
              labelPrevious: () => "이전 달",
              labelNext: () => "다음 달",
              labelMonthDropdown: () => "월 선택",
              labelYearDropdown: () => "연도 선택",
            }}
          />
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        시작일과 종료일을 선택해 2~{MAX_RANGE_DAYS}일 범위로 지정할 수 있어요.
      </p>
    </div>
  );
}
