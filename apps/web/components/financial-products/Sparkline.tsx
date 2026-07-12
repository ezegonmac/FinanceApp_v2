'use client';

type SparklinePoint = {
  timestamp: string;
  percentChange: number;
};

type Props = {
  points: SparklinePoint[];
  width?: number;
  height?: number;
};

/**
 * Lightweight SVG sparkline with a gradient fill area beneath the line.
 * Green for positive trend, red for negative, muted for flat/no data.
 */
export function Sparkline({ points, width = 64, height = 28 }: Props) {
  // Determine data to render
  const values =
    points.length > 0
      ? points.map((p) => p.percentChange)
      : [0, 0]; // flat line fallback

  // Determine color variant based on overall trend
  let strokeClass = "stroke-muted-foreground";
  let colorVar: "neutral" | "positive" | "negative" = "neutral";
  if (points.length >= 2) {
    const lastValue = points[points.length - 1]!.percentChange;
    if (lastValue > 0.01) {
      strokeClass = "stroke-positive";
      colorVar = "positive";
    } else if (lastValue < -0.01) {
      strokeClass = "stroke-negative";
      colorVar = "negative";
    }
  }

  // Compute SVG coordinates
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const coords = values.map((val, i) => {
    const x = padding + (i / (values.length - 1 || 1)) * drawWidth;
    const y = padding + drawHeight - ((val - min) / range) * drawHeight;
    return { x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  // Closed path for the filled area: line points + bottom-right + bottom-left
  const areaPath = [
    `M ${coords[0]!.x},${coords[0]!.y}`,
    ...coords.slice(1).map((c) => `L ${c.x},${c.y}`),
    `L ${coords[coords.length - 1]!.x},${height}`,
    `L ${coords[0]!.x},${height}`,
    "Z",
  ].join(" ");

  // Unique gradient ID per color to avoid conflicts when multiple sparklines render
  const gradientId = `sparkline-grad-${colorVar}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={
              colorVar === "positive"
                ? "var(--color-positive)"
                : colorVar === "negative"
                  ? "var(--color-negative)"
                  : "currentColor"
            }
            stopOpacity={0.12}
          />
          <stop
            offset="100%"
            stopColor={
              colorVar === "positive"
                ? "var(--color-positive)"
                : colorVar === "negative"
                  ? "var(--color-negative)"
                  : "currentColor"
            }
            stopOpacity={0}
          />
        </linearGradient>
      </defs>

      {/* Gradient fill area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line on top */}
      <polyline
        points={polylinePoints}
        className={strokeClass}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
