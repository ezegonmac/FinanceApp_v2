'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonthLong } from "@repo/utils";
import IncomesTable from "@/components/incomes/IncomesTable";
import TransactionsTable from "@/components/transactions/TransactionsTable";

type Props = {
  year: number;
  month: number;
};

export default function MonthContent({ year, month }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [incomes, setIncomes] = useState<any[]>([]);
  const [incomesLoading, setIncomesLoading] = useState(false);
  const [incomesError, setIncomesError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncomes();
    fetchTransactions();
  }, [year, month]);

  async function fetchIncomes() {
    setIncomesLoading(true);
    setIncomesError(null);
    try {
      const res = await fetch(`/api/months/${year}/${month}/incomes`);
      if (!res.ok) throw new Error("Failed to fetch incomes");
      setIncomes(await res.json());
    } catch {
      setIncomesError("Failed to fetch incomes");
    } finally {
      setIncomesLoading(false);
    }
  }

  async function fetchTransactions() {
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const res = await fetch(`/api/months/${year}/${month}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      setTransactions(await res.json());
    } catch {
      setTransactionsError("Failed to fetch transactions");
    } finally {
      setTransactionsLoading(false);
    }
  }

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
          <IncomesTable
            incomes={incomes}
            loading={incomesLoading}
            error={incomesError}
            showMonth={false}
            showAccount={true}
          />

          <br />
          <br />

          <h2>Transactions for this Month</h2>
          <TransactionsTable
            transactions={transactions}
            loading={transactionsLoading}
            error={transactionsError}
            showMonth={false}
            showAccount={true}
          />
        </>
      )}
    </div>
  );
}
