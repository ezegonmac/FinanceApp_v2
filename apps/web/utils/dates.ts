function formatYearMonth(year: number, month: number) {
    return `${year}-${String(month).padStart(2, "0")}`;
}

export { formatYearMonth };