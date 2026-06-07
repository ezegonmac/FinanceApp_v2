'use client';

import { useState } from "react";
import { Check, Landmark } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const AVAILABLE_ICONS = [
  { key: "bbva.png", label: "BBVA" },
  { key: "binance.jpeg", label: "Binance" },
  { key: "caixabank.jpeg", label: "CaixaBank" },
  { key: "my_investor.jpeg", label: "MyInvestor" },
  { key: "revolut.png", label: "Revolut" },
  { key: "santander.jpeg", label: "Santander" },
  { key: "trade_republic.jpeg", label: "Trade Republic" },
] as const;

type Props = {
  value: string | null;
  onChange: (icon: string | null) => void;
  disabled?: boolean;
};

export default function IconPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Account icon</span>
      <div className="flex flex-wrap gap-2">
        {/* Generic / no icon option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-lg border-2 transition-colors",
            value === null
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-muted-foreground/30",
            disabled && "pointer-events-none opacity-50"
          )}
          title="Generic"
        >
          <Landmark className="size-6 text-muted-foreground" />
          {value === null && (
            <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary">
              <Check className="size-2.5 text-primary-foreground" />
            </div>
          )}
        </button>

        {AVAILABLE_ICONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex size-12 items-center justify-center rounded-lg border-2 transition-colors",
              value === key
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30",
              disabled && "pointer-events-none opacity-50"
            )}
            title={label}
          >
            <Image
              src={`/icons/${key}`}
              alt={label}
              width={32}
              height={32}
              className="rounded-md object-contain"
            />
            {value === key && (
              <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary">
                <Check className="size-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
