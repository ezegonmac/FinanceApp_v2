'use client';

import { useDebug } from "./DebugContext";

export default function DebugToggle() {
  const { debug, toggleDebug } = useDebug();

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "5px",
        display: "inline-flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <span>
        Debug mode: <b style={{ color: debug ? "orange" : "inherit" }}>{debug ? "ON" : "OFF"}</b>
      </span>
      <button onClick={toggleDebug}>
        {debug ? "Disable Debug Mode" : "Enable Debug Mode"}
      </button>
    </div>
  );
}
