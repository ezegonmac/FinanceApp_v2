'use client';

import { useState } from "react";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import { Button } from "@/components/ui/button";

type Props = {
  value: Timeframe | "CUSTOM";
  onChange: (t: Timeframe) => void;
  onCustomRangeChange?: (startDate: Date, endDate: Date) => void;
  customRange?: { startDate: Date; endDate: Date } | null;
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

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TimeframeSelector({
  value,
  onChange,
  onCustomRangeChange,
  customRange,
}: Props) {
  const [showCustomPicker, setShowCustomPicker] = useState(value === "CUSTOM");
  const [startDateStr, setStartDateStr] = useState(
    customRange ? formatDateForInput(customRange.startDate) : ""
  );
  const [endDateStr, setEndDateStr] = useState(
    customRange ? formatDateForInput(customRange.endDate) : ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const isCustomActive = value === "CUSTOM";

  function handlePresetClick(timeframe: Timeframe) {
    setShowCustomPicker(false);
    setStartDateStr("");
    setEndDateStr("");
    setValidationError(null);
    onChange(timeframe);
  }

  function handleCustomClick() {
    setShowCustomPicker(true);
  }

  function handleDateChange(newStart: string, newEnd: string) {
    setValidationError(null);

    if (newStart && newEnd) {
      const start = new Date(newStart);
      const end = new Date(newEnd);

      if (start >= end) {
        setValidationError("Start date must be before end date");
        return;
      }

      onCustomRangeChange?.(start, end);
    }
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newStart = e.target.value;
    setStartDateStr(newStart);
    handleDateChange(newStart, endDateStr);
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newEnd = e.target.value;
    setEndDateStr(newEnd);
    handleDateChange(startDateStr, newEnd);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {TIMEFRAMES.map((tf) => {
          const isActive = !isCustomActive && tf.value === value;
          return (
            <Button
              key={tf.value}
              variant={isActive ? "default" : "ghost"}
              className={isActive ? "font-bold" : "font-normal"}
              onClick={() => handlePresetClick(tf.value)}
            >
              {tf.label}
            </Button>
          );
        })}
        <Button
          variant={isCustomActive ? "default" : "ghost"}
          className={isCustomActive ? "font-bold" : "font-normal"}
          onClick={handleCustomClick}
        >
          Custom
        </Button>
      </div>

      {showCustomPicker && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDateStr}
            onChange={handleStartDateChange}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            aria-label="Start date"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            value={endDateStr}
            onChange={handleEndDateChange}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            aria-label="End date"
          />
          {validationError && (
            <span className="text-sm text-destructive">{validationError}</span>
          )}
        </div>
      )}
    </div>
  );
}
