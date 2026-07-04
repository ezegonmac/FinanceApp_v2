export type Timeframe = "TODAY" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "ALL";
export type YahooInterval = "15m" | "1h" | "1d" | "1wk";

export type GranularityValue = "DAILY" | "HOURLY" | "FIFTEEN_MIN" | "WEEKLY";

// Timeframe → { granularity, yahoo interval } mapping
// Granularity is overridden to DAILY for INTRADAY assets when timeframe
// maps to 15m or 1h (funds do not have intraday pricing).
export const TIMEFRAME_CONFIG: Record<
  Timeframe,
  { granularity: GranularityValue; interval: YahooInterval }
> = {
  TODAY: { granularity: "FIFTEEN_MIN", interval: "15m" },
  "1W":  { granularity: "HOURLY",      interval: "1h"  },
  "1M":  { granularity: "DAILY",       interval: "1d"  },
  "3M":  { granularity: "DAILY",       interval: "1d"  },
  "6M":  { granularity: "DAILY",       interval: "1d"  },
  "1Y":  { granularity: "DAILY",       interval: "1d"  },
  "5Y":  { granularity: "WEEKLY",      interval: "1wk" },
  ALL:   { granularity: "WEEKLY",      interval: "1wk" },
};
