function formatYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatYearMonthLong(year: number, month: number) {
    const date = new Date(year, month - 1); // month is 0-indexed
    return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export { formatYearMonth, formatYearMonthLong };