'use client';

import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import { Button } from "@/components/ui/button";

type Props = {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
};

const TIMEFRAMES: Array<{ value: Timeframe; label: string }> = [
  { value: "TODAY", label: "Today" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
  { value: "ALL", label: "All" },
];

export function TimeframeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((tf) => {
        const isActive = tf.value === value;
        return (
          <Button
            key={tf.value}
            variant={isActive ? "default" : "ghost"}
            className={isActive ? "font-bold" : "font-normal"}
            onClick={() => {
              if (tf.value !== value) {
                onChange(tf.value);
              }
            }}
          >
            {tf.label}
          </Button>
        );
      })}
    </div>
  );
}
