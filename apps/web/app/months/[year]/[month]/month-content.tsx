'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonthLong } from "@repo/utils";
import { Button } from "@/components/ui/button";
import IncomesTable from "@/components/incomes/IncomesTable";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import ExpensesTable from "@/components/expenses/ExpensesTable";
import ExpensesCircularPlot from "@/components/expenses/ExpensesCircularPlot";
import MonthSnapshotsTable from "@/components/snapshots/MonthSnapshotsTable";
import AccountMonthBreakdownTable from "@/components/snapshots/AccountMonthBreakdownTable";
import AccountMovementsBreakdownTable from "@/components/snapshots/AccountMovementsBreakdownTableRefactored";
import AccountSpentLeftTable from "@/components/snapshots/AccountSpentLeftTableRefactored";

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
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={goToPreviousMonth} disabled={isLoading}>
          ← Previous
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{formatYearMonthLong(year, month)}</h1>
        <Button variant="outline" onClick={goToNextMonth} disabled={isLoading}>
          Next →
        </Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Monthly Summary</h2>
            <MonthSnapshotsTable snapshots={snapshots} loading={snapshotsLoading} />
          </section>

          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Account Breakdown</h2>
            <AccountMonthBreakdownTable
              snapshots={snapshots}
              allAccounts={allAccounts}
              loading={snapshotsLoading}
            />
          </section>

          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Incomes for this Month</h2>
            <IncomesTable
              incomes={incomes}
              loading={incomesLoading}
              error={incomesError}
              showMonth={false}
              showAccount={true}
              onDeleted={(id) => { setIncomes((prev) => prev.filter((i) => i.id !== id)); fetchSnapshots(); }}
            />
          </section>

          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Transactions for this Month</h2>
            <TransactionsTable
              transactions={transactions}
              loading={transactionsLoading}
              error={transactionsError}
              showMonth={false}
              showAccount={true}
              onDeleted={(id) => { setTransactions((prev) => prev.filter((t) => t.id !== id)); fetchSnapshots(); }}
            />
          </section>

          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Expenses for this Month</h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="overflow-hidden">
                <ExpensesTable
                  expenses={expenses}
                  loading={expensesLoading}
                  error={expensesError}
                  showMonth={false}
                  showAccount={true}
                  showCircularPlot={false}
                  showAnalytics={true}
                  onDeleted={(id) => { setExpenses((prev) => prev.filter((e) => e.id !== id)); fetchSnapshots(); }}
                />
              </div>
              <div className="flex items-start justify-center">
                <ExpensesCircularPlot expenses={expenses} />
              </div>
            </div>
          </section>

          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Account Spent / Left Summary</h2>
            <AccountSpentLeftTable
              snapshots={snapshots}
              allAccounts={allAccounts}
              expenses={expenses}
              transactions={transactions}
              loading={snapshotsLoading}
            />
          </section>

          <section className="rounded-md border bg-card p-6 text-card-foreground">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Account Movements Breakdown</h2>
            <AccountMovementsBreakdownTable
              allAccounts={allAccounts}
              incomes={incomes}
              expenses={expenses}
              transactions={transactions}
              loading={incomesLoading || expensesLoading || transactionsLoading}
            />
          </section>
        </>
      )}
    </div>
  );
}
