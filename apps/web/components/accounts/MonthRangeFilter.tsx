import { Button } from "@/components/ui/button";
import type { MonthRangePreset } from "./month-range-utils";

type Props = {
  preset: MonthRangePreset;
  startMonth: string;
  endMonth: string;
  onChangePreset: (value: MonthRangePreset) => void;
  onChangeStartMonth: (value: string) => void;
  onChangeEndMonth: (value: string) => void;
};

export default function MonthRangeFilter({
  preset,
  startMonth,
  endMonth,
  onChangePreset,
  onChangeStartMonth,
  onChangeEndMonth,
}: Props) {
  const options: Array<{ value: MonthRangePreset; label: string }> = [
    { value: "this-month", label: "This month" },
    { value: "past-3-months", label: "Past 3 months" },
    { value: "next-3-months", label: "Next 3 months" },
    { value: "all", label: "All" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={preset === option.value ? "default" : "outline"}
            size="xs"
            onClick={() => onChangePreset(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {preset === "custom" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start month</span>
            <input
              type="month"
              value={startMonth}
              onChange={(event) => onChangeStartMonth(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End month</span>
            <input
              type="month"
              value={endMonth}
              onChange={(event) => onChangeEndMonth(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
