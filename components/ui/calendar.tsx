"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-2 sm:p-3", className)}
      classNames={{
        months: "relative flex w-full flex-col gap-6 sm:flex-row",
        month: "relative flex w-full flex-col gap-4",
        month_caption: "relative flex h-11 w-full items-center justify-center px-12",
        caption_label: "text-sm font-medium",
        dropdowns: "flex items-center justify-center gap-1 text-sm font-medium",
        dropdown_root: "relative rounded-md border border-border bg-background px-2 py-1",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        nav: "absolute inset-x-0 top-2 z-10 flex items-center justify-between px-2 sm:top-3 sm:px-3",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-0 top-0 z-10 size-11 touch-manipulation bg-background p-0 opacity-90 shadow-sm hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-0 top-0 z-10 size-11 touch-manipulation bg-background p-0 opacity-90 shadow-sm hover:opacity-100"
        ),
        month_grid: "mx-auto w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex-1 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        day: cn(
          "relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-accent",
          "[&:has([aria-selected].range-end)]:rounded-r-md",
          "[&:has([aria-selected].range-start)]:rounded-l-md",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "mx-auto size-10 touch-manipulation p-0 font-normal hover:bg-transparent hover:text-inherit focus:bg-transparent aria-selected:opacity-100 sm:size-9"
        ),
        range_start:
          "range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;

          return <Icon className={cn("size-5", className)} {...props} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
