'use client';

import { Button } from "@/components/ui/button";

type RecurrentStatus = "ALL" | "ACTIVE" | "PAUSED" | "CANCELLED";

type Props = {
  value: RecurrentStatus;
  onChange: (status: RecurrentStatus) => void;
};

export default function RecurrentStatusFilter({ value, onChange }: Props) {
  const options: Array<{ label: string; value: RecurrentStatus }> = [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Paused", value: "PAUSED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="xs"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
