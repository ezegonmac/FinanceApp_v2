'use client';

import { useEffect, useState } from "react";
import AddRecurrentExpenseForm from "./AddRecurrentExpenseForm";
import RecurrentExpensesTable from "./RecurrentExpensesTable";

type RecurrentExpense = {
  id: number;
  account_id: number;
  amount: string;
  description: string | null;
  kind: "FIXED" | "VARIABLE";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  start_month: string | null;
  end_month: string | null;
  next_run_year: number | null;
  next_run_month: number | null;
  last_applied_month_id: number | null;
  created_at: string;
  account_name?: string;
};

export default function RecurrentExpensesView() {
  const [recurrentExpenses, setRecurrentExpenses] = useState<RecurrentExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchRecurrentExpenses();
  }, [refreshKey]);

  const fetchRecurrentExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recurrent-expenses");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to fetch recurrent expenses${details}`);
      }
      setRecurrentExpenses(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recurrent expenses");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this recurrent expense and all generated child expenses?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/recurrent-expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to delete recurrent expense${details}`);
      }

      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recurrent expense");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <RecurrentExpensesTable
        recurrentExpenses={recurrentExpenses}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <br />
      <AddRecurrentExpenseForm onAdded={refresh} />
      &nbsp;
      <button onClick={refresh} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
