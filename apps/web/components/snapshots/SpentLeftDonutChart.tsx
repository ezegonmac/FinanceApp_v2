'use client';

interface OutMovement {
  key: string;
  label: string;
  pctOfIn: number;
  color: string;
}

interface Props {
  leftPct: number;
  outMovements: OutMovement[];
}

const donutHole: React.CSSProperties = {
  position: "absolute",
  inset: "24%",
  borderRadius: "50%",
  background: "white",
};

const cleanLabel = (value: string) => value.replace(/^Transfer\s+(In|Out):\s*/i, "");
const fmtPct = (value: number) => (value === 0 ? "-" : `${value.toFixed(1)}%`);

function buildConic(stops: Array<{ pct: number; color: string }>) {
  if (stops.length === 0) return "#f1f1f1";

  let start = 0;
  const parts = stops.map((stop) => {
    const end = Math.min(100, start + stop.pct);
    const chunk = `${stop.color} ${start}% ${end}%`;
    start = end;
    return chunk;
  });

  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}

export default function SpentLeftDonutChart({ leftPct, outMovements }: Props) {
  const donutStops = [
    { pct: leftPct, color: "green" },
    ...outMovements.map((movement) => ({ pct: movement.pctOfIn, color: movement.color })),
  ];

  const donutRing: React.CSSProperties = {
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: buildConic(donutStops),
    position: "relative",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center" }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Spent vs Left Distribution</div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div style={donutRing}>
          <div style={donutHole} />
        </div>
        <div style={{ fontSize: 13, flex: 1, maxWidth: 220 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: "green" }}>■</span> Left {fmtPct(leftPct)}
          </div>
          {outMovements.length === 0 ? (
            <div>
              <span style={{ color: "#999" }}>■</span> No out movements
            </div>
          ) : (
            outMovements.map((movement) => (
              <div key={`legend-${movement.key}`} style={{ marginBottom: 4 }}>
                <span style={{ color: movement.color }}>■</span> {cleanLabel(movement.label)} {fmtPct(movement.pctOfIn)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
