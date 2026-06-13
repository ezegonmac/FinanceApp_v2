import { cn } from "@/lib/utils";

type HeaderKPIProps = {
  label: string;
  value: string;
  delta?: {
    value: string;
    direction: "up" | "down" | "neutral";
    context?: string;
  };
  className?: string;
};

export function HeaderKPI({ label, value, delta, className }: HeaderKPIProps) {
  return (
    <div className={cn("text-right", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-baseline justify-end gap-3">
        <p className="text-3xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        {delta && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
                delta.direction === "up" && "bg-positive-subtle text-positive-subtle-foreground",
                delta.direction === "down" && "bg-negative-subtle text-negative-subtle-foreground",
                delta.direction === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {delta.direction === "up" && "↑"}
              {delta.direction === "down" && "↓"}
              {delta.value}
            </span>
          </div>
        )}
      </div>
      {delta?.context && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{delta.context}</p>
      )}
    </div>
  );
}
