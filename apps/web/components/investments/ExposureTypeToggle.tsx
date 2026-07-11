"use client";

import { Button } from "@/components/ui/button";

type ExposureTypeToggleProps = {
  value: "SECTOR" | "COUNTRY";
  onChange: (type: "SECTOR" | "COUNTRY") => void;
};

export function ExposureTypeToggle({
  value,
  onChange,
}: ExposureTypeToggleProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant={value === "SECTOR" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("SECTOR")}
      >
        Sector
      </Button>
      <Button
        variant={value === "COUNTRY" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("COUNTRY")}
      >
        Country
      </Button>
    </div>
  );
}
