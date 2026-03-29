'use client';

import { useDebug } from "./DebugContext";

export default function DebugIndicator() {
  const { debug } = useDebug();
  if (!debug) return null;
  return (
    <span style={{ color: "orange", fontWeight: "bold", marginLeft: "0.5rem" }}>
      [DEBUG]
    </span>
  );
}
