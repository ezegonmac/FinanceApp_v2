'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonthLong } from "@repo/utils";
import IncomesTable from "@/components/incomes/IncomesTable";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import ExpensesTable from "@/components/expenses/ExpensesTable";
import MonthSnapshotsTable from "@/components/snapshots/MonthSnapshotsTable";
import AccountMonthBreakdownTable from "@/components/snapshots/AccountMonthBreakdownTable";
import AccountMovementsBreakdownTable from "@/components/snapshots/AccountMovementsBreakdownTable";
import AccountSpentLeftTable from "@/components/snapshots/AccountSpentLeftTable";

type Props = {
  year: number;
  month: number;
};

type MonthSnapshot = {
  id: number;
  account_id: number;
  total_incomes: string;
  total_expenses: string;
  total_transactions_in: string;
  total_transactions_out: string;
  account: { id: number; name: string };
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

  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  const [snapshots, setSnapshots] = useState<MonthSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  const [allAccounts, setAllAccounts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchIncomes();
    fetchTransactions();
    fetchExpenses();
    fetchSnapshots();
    fetchAllAccounts();
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

  async function fetchExpenses() {
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const res = await fetch(`/api/months/${year}/${month}/expenses`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      setExpenses(await res.json());
    } catch {
      setExpensesError("Failed to fetch expenses");
    } finally {
      setExpensesLoading(false);
    }
  }

  async function fetchSnapshots() {
    setSnapshotsLoading(true);
    try {
      const res = await fetch(`/api/months/${year}/${month}/snapshots`);
      if (res.ok) setSnapshots(await res.json());
    } finally {
      setSnapshotsLoading(false);
    }
  }

  async function fetchAllAccounts() {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAllAccounts(data.map((a: { id: number; name: string }) => ({ id: a.id, name: a.name })));
      }
    } catch {
      // silently ignore
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
          <h2>Monthly Summary</h2>
          <MonthSnapshotsTable snapshots={snapshots} loading={snapshotsLoading} />

          <h2>Account Breakdown</h2>
          <AccountMonthBreakdownTable
            snapshots={snapshots}
            allAccounts={allAccounts}
            loading={snapshotsLoading}
          />

          <h2>Account Movements Breakdown</h2>
          <AccountMovementsBreakdownTable
            allAccounts={allAccounts}
            incomes={incomes}
            expenses={expenses}
            transactions={transactions}
            loading={incomesLoading || expensesLoading || transactionsLoading}
          />

          <h2>Account Spent / Left Summary</h2>
          <AccountSpentLeftTable
            snapshots={snapshots}
            allAccounts={allAccounts}
            expenses={expenses}
            transactions={transactions}
            loading={snapshotsLoading}
          />

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

          <br />
          <br />

          <h2>Expenses for this Month</h2>
          <ExpensesTable
            expenses={expenses}
            loading={expensesLoading}
            error={expensesError}
            showMonth={false}
            showAccount={true}
            showCircularPlot={true}
            showAnalytics={true}
          />
        </>
      )}
    </div>
  );
}
