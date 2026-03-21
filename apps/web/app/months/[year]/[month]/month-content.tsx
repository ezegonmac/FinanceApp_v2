'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonthLong } from "@repo/utils";

type Props = {
  year: number;
  month: number;
};

export default function MonthContent({ year, month }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function handleNavigate(newYear: number, newMonth: number) {
    setIsLoading(true);
    router.push(`/months/${newYear}/${newMonth}`);
  }

  function goToPreviousMonth() {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear--;
    }
    handleNavigate(prevYear, prevMonth);
  }

  function goToNextMonth() {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    handleNavigate(nextYear, nextMonth);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <button onClick={goToPreviousMonth} disabled={isLoading}>
          ← Previous
        </button>
        <h1 style={{ margin: 0 }}>{formatYearMonthLong(year, month)}</h1>
        <button onClick={goToNextMonth} disabled={isLoading}>
          Next →
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>Incomes for this Month</h2>
          {/* <IncomesTable monthId={monthId} /> */}

          <br />
          <br />

          <h2>Transactions for this Month</h2>
          {/* <TransactionsTable monthId={monthId} /> */}
        </>
      )}
    </div>
  );
}
