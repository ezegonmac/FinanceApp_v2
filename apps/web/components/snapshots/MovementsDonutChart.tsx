'use client';

interface DonutSlice {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
}

interface Props {
  title: string;
  slices: DonutSlice[];
}

const donutHole: React.CSSProperties = {
  position: "absolute",
  inset: "24%",
  borderRadius: "50%",
  background: "white",
};

const cleanLabel = (value: string) => value.replace(/^Transfer\s+(In|Out):\s*/i, "");
const donutPct = (value: number) => (value === 0 ? "-" : `${value.toFixed(1)}%`);

function buildConicStops(slices: DonutSlice[]) {
  let start = 0;
  return slices
    .map((slice) => {
      const end = Math.min(100, start + slice.pct);
      const stop = `${slice.color} ${start}% ${end}%`;
      start = end;
      return stop;
    })
    .join(", ");
}

const donutRing = (slices: DonutSlice[]): React.CSSProperties => ({
  width: 220,
  height: 220,
  borderRadius: "50%",
  background: slices.length === 0 ? "#f1f1f1" : `conic-gradient(from 0deg, ${buildConicStops(slices)})`,
  position: "relative",
  flexShrink: 0,
});

export default function MovementsDonutChart({ title, slices }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center" }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div style={donutRing(slices)}>
          <div style={donutHole} />
        </div>
        <div style={{ fontSize: 13, flex: 1, maxWidth: 220 }}>
          {slices.length === 0 ? (
            <div>-</div>
          ) : (
            slices.map((slice) => (
              <div key={`slice-${slice.key}`} style={{ marginBottom: 4 }}>
                <span style={{ color: slice.color }}>■</span> {cleanLabel(slice.label)} {donutPct(slice.pct)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
