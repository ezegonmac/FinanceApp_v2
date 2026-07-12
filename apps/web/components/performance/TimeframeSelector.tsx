"use client";

import { cn } from "@/lib/utils";

export type Timeframe = "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL";

const TIMEFRAMES: Timeframe[] = ["1M", "3M", "6M", "1Y", "YTD", "ALL"];

type TimeframeSelectorProps = {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
};

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe}
          type="button"
          onClick={() => onChange(timeframe)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            timeframe === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
}
