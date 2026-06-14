import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeaderKPI — the primary metric shown in a page header (right-aligned).
 *
 * Composition (top → bottom):
 *   ┌ label        "TOTAL BALANCE"
 *   ├ value row    "€16,821.50"  ↑2.3%   ← badge vertically centered on value
 *   └ context                    "vs last month"  ← sits beneath the badge
 *
 * The amount dominates; the delta badge is a quiet annotation.
 */

type DeltaDirection = "up" | "down" | "neutral";

type DeltaProps = {
  /** Formatted change, e.g. "2.3%". */
  value: string;
  /** Drives badge color and arrow glyph. */
  direction: DeltaDirection;
  /** Optional caption beneath the badge, e.g. "vs last month". */
  context?: string;
};

type HeaderKPIProps = {
  /** Uppercase caption above the value, e.g. "Total Balance". */
  label: string;
  /** Pre-formatted metric value, e.g. "€16,821.50". */
  value: string;
  /** Optional change indicator rendered to the right of the value. */
  delta?: DeltaProps;
  className?: string;
};

/** Per-direction badge styles: subtle border + muted fill + readable text. */
const DELTA_BADGE_STYLES: Record<DeltaDirection, string> = {
  up: "border-positive/10 bg-positive-subtle/60 text-positive-subtle-foreground",
  down: "border-negative/10 bg-negative-subtle/60 text-negative-subtle-foreground",
  neutral: "border-border/50 bg-muted/60 text-muted-foreground",
};

/** Per-direction chevron icon (neutral shows none). */
const DELTA_ICON: Record<DeltaDirection, LucideIcon | null> = {
  up: ChevronUp,
  down: ChevronDown,
  neutral: null,
};

function DeltaBadge({ value, direction, context }: DeltaProps) {
  const Icon = DELTA_ICON[direction];

  return (
    // `self-center` aligns the badge with the vertical center of the value.
    <div data-slot="kpi-delta" className="flex flex-col items-start self-center">
      <span
        data-slot="kpi-delta-badge"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none",
          DELTA_BADGE_STYLES[direction]
        )}
      >
        {Icon && <Icon className="size-3" strokeWidth={2.5} aria-hidden="true" />}
        {value}
      </span>

      {context && (
        <span data-slot="kpi-delta-context" className="ml-0.5 mt-0.5 text-[10px] text-muted-foreground">
          {context}
        </span>
      )}
    </div>
  );
}

export function HeaderKPI({ label, value, delta, className }: HeaderKPIProps) {
  return (
    <div data-slot="header-kpi" className={cn("min-w-[220px] text-left", className)}>
      <p
        data-slot="kpi-label"
        className="text-[12px] font-normal uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </p>

      <div data-slot="kpi-value-row" className="flex items-end justify-start gap-3">
        <p
          data-slot="kpi-value"
          className="text-3xl font-semibold leading-none tabular-nums text-foreground"
        >
          {value}
        </p>

        {delta && <DeltaBadge {...delta} />}
      </div>
    </div>
  );
}
