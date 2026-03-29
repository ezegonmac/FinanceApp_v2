'use client';

import { useEffect, useState } from "react";
import RecurrentIncomesTable from "./RecurrentIncomesTable";
import AddRecurrentIncomeForm from "./AddRecurrentIncomeForm";

type RecurrentIncome = {
  id: number;
  account_id: number;
  amount: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  start_month: string | null;
  end_month: string | null;
  next_run_year: number | null;
  next_run_month: number | null;
  last_applied_month_id: number | null;
  created_at: string;
  account_name?: string;
};

export default function RecurrentIncomesView() {
  const [recurrentIncomes, setRecurrentIncomes] = useState<RecurrentIncome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchRecurrentIncomes();
  }, [refreshKey]);

  const fetchRecurrentIncomes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recurrent-incomes");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to fetch recurrent incomes${details}`);
      }
      setRecurrentIncomes(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recurrent incomes");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <>
      <RecurrentIncomesTable
        recurrentIncomes={recurrentIncomes}
        loading={loading}
        error={error}
      />

      <br />
      <AddRecurrentIncomeForm onAdded={refresh} />
      &nbsp;
      <button onClick={refresh} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
