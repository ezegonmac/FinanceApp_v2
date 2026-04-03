'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExpensesTable from "./ExpensesTable";
import AddExpenseForm from "./AddExpenseForm";

type Props = {
  accountId: number;
};

export default function AccountExpensesView({ accountId }: Props) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, [refreshKey]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounts/${accountId}/expenses`);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      setExpenses(await response.json());
    } catch {
      setError("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  return (
    <>
      <ExpensesTable expenses={expenses} loading={loading} error={error} showMonth={true} showAccount={false} onDeleted={refresh} />
      <br />
      <AddExpenseForm accountId={accountId} onAdded={refresh} />
      &nbsp;
      <button onClick={refresh} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
