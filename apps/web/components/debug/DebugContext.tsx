'use client';

import { createContext, useContext, useEffect, useState } from "react";

type DebugContextType = {
  debug: boolean;
  toggleDebug: () => void;
};

const DebugContext = createContext<DebugContextType>({
  debug: false,
  toggleDebug: () => {},
});

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    setDebug(localStorage.getItem("debugMode") === "true");
  }, []);

  const toggleDebug = () => {
    setDebug((prev) => {
      const next = !prev;
      localStorage.setItem("debugMode", String(next));
      return next;
    });
  };

  return (
    <DebugContext.Provider value={{ debug, toggleDebug }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  return useContext(DebugContext);
}
