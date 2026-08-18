"use client";

import * as React from "react";
import { Check, MapPin, Search } from "lucide-react";

import {
  searchBirthLocations,
  type BirthLocation,
} from "@/lib/birth-options";
import { cn } from "@/lib/utils";

interface LocationComboboxProps {
  value: BirthLocation | null;
  onChange: (location: BirthLocation | null) => void;
}

export function LocationCombobox({ value, onChange }: LocationComboboxProps) {
  const listboxId = React.useId();
  const [query, setQuery] = React.useState(value?.label ?? "");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const results = React.useMemo(() => searchBirthLocations(query), [query]);

  const selectLocation = (location: BirthLocation) => {
    onChange(location);
    setQuery(location.label);
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((index) => (open ? Math.min(index + 1, results.length - 1) : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && results[activeIndex]) {
      event.preventDefault();
      selectLocation(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          role="combobox"
          aria-label="출산 지역"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && results[activeIndex]
              ? `${listboxId}-option-${results[activeIndex].id}`
              : undefined
          }
          autoComplete="off"
          value={query}
          onFocus={() => setOpen(Boolean(query.trim()))}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(null);
            setOpen(Boolean(event.target.value.trim()));
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="동네 이름 검색, 예: 광안리, 판교, 해운대"
          className={cn(
            "h-12 w-full rounded-[1rem] border bg-background/90 pl-10 pr-10 text-base shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
            value ? "border-primary/50" : "border-input"
          )}
        />
        {value && (
          <Check
            aria-label="선택 완료"
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-primary"
          />
        )}
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="지역 검색 결과"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1.5 shadow-xl"
        >
          {results.length > 0 ? (
            results.map((location, index) => (
              <button
                id={`${listboxId}-option-${location.id}`}
                key={location.id}
                type="button"
                role="option"
                aria-selected={value?.id === location.id}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectLocation(location)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
                )}
              >
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 leading-5">{location.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {location.correctionMinutes > 0 ? "+" : ""}
                  {location.correctionMinutes}분
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              일치하는 지역이 없어요. 읍, 면, 동 이름으로 검색해 주세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
