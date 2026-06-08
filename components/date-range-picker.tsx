"use client";

import * as React from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
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

const MAX_RANGE_DAYS = 14;

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

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range.to) {
      const diff = differenceInCalendarDays(range.to, range.from);

      if (!value?.from && diff === 0) {
        onChange({ from: range.from, to: undefined });
        return;
      }

      if (diff + 1 > MAX_RANGE_DAYS) {
        onChange({ from: range.from, to: undefined });
        return;
      }

      setOpen(false);
    }
    onChange(range);
  };

  const disabledDays =
    value?.from && !value.to
      ? [{ before: value.from }, { after: addDays(value.from, MAX_RANGE_DAYS - 1) }]
      : { before: new Date() };

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
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ko}
            disabled={disabledDays}
          />
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        최대 {MAX_RANGE_DAYS}일(2주) 범위까지 선택할 수 있어요.
      </p>
    </div>
  );
}
