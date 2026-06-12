import { cn } from "@/lib/utils";

type HeroMetricProps = {
  title: string;
  description?: string;
  label: string;
  value: string;
  delta?: {
    value: string;
    direction: "up" | "down" | "neutral";
    context?: string;
  };
  className?: string;
};

export function HeroMetric({ title, description, label, value, delta, className }: HeroMetricProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-6 rounded-xl bg-card px-6 py-5",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="text-right">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        {delta && (
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
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
            {delta.context && (
              <span className="text-[11px] text-muted-foreground">{delta.context}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
