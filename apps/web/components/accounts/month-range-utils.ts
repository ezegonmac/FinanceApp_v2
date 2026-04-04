export const getCurrentMonthInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export type MonthRangePreset =
  | "this-month"
  | "past-3-months"
  | "next-3-months"
  | "all"
  | "custom";

const toMonthInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const getRangeForPreset = (preset: Exclude<MonthRangePreset, "custom">) => {
  const now = new Date();
  const currentMonth = toMonthInput(now);

  if (preset === "this-month") {
    return { startMonth: currentMonth, endMonth: currentMonth };
  }

  if (preset === "past-3-months") {
    return {
      startMonth: toMonthInput(addMonths(now, -2)),
      endMonth: currentMonth,
    };
  }

  if (preset === "next-3-months") {
    return {
      startMonth: currentMonth,
      endMonth: toMonthInput(addMonths(now, 2)),
    };
  }

  return {
    startMonth: "1900-01",
    endMonth: "9999-12",
  };
};

const toMonthIndex = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return Number.NaN;
  return year * 100 + month;
};

export const isWithinMonthRange = (
  year: number | undefined,
  month: number | undefined,
  startMonth: string,
  endMonth: string
) => {
  if (!year || !month) return false;

  const value = year * 100 + month;
  const start = toMonthIndex(startMonth);
  const end = toMonthIndex(endMonth);

  if (Number.isNaN(start) || Number.isNaN(end)) return false;

  return value >= start && value <= end;
};

export const compareByMonthDescriptionAmount = (
  a: {
    month?: { year?: number; month?: number };
    description?: string | null;
    amount?: string | number | null;
  },
  b: {
    month?: { year?: number; month?: number };
    description?: string | null;
    amount?: string | number | null;
  }
) => {
  const aYear = a.month?.year ?? 0;
  const bYear = b.month?.year ?? 0;
  const aMonth = a.month?.month ?? 0;
  const bMonth = b.month?.month ?? 0;

  if (aYear !== bYear) return bYear - aYear;
  if (aMonth !== bMonth) return bMonth - aMonth;

  const aDescription = (a.description ?? "").toLowerCase();
  const bDescription = (b.description ?? "").toLowerCase();

  const byDescription = aDescription.localeCompare(bDescription);
  if (byDescription !== 0) return byDescription;

  const aAmount = Number(a.amount ?? 0);
  const bAmount = Number(b.amount ?? 0);

  return aAmount - bAmount;
};
