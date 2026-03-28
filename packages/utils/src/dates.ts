function formatYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatYearMonthLong(year: number, month: number) {
    const date = new Date(year, month - 1); // month is 0-indexed
    return date.toLocaleString("default", { month: "long", year: "numeric" });
}

function getEuropeMadridDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const yearPart = parts.find((part) => part.type === "year")?.value;
  const monthPart = parts.find((part) => part.type === "month")?.value;
  const dayPart = parts.find((part) => part.type === "day")?.value;

  if (!yearPart || !monthPart || !dayPart) {
    throw new Error("Failed to resolve Europe/Madrid date parts");
  }

  return {
    year: Number(yearPart),
    month: Number(monthPart),
    day: Number(dayPart),
  };
}

function getEuropeMadridDateKey(date: Date = new Date()) {
  const { year, month, day } = getEuropeMadridDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export {
  formatYearMonth,
  formatYearMonthLong,
  getEuropeMadridDateParts,
  getEuropeMadridDateKey,
};