'use client';

import { useEffect, useState } from "react";
import RecurrentIncomesTable from "./RecurrentIncomesTable";
import AddRecurrentIncomeForm from "./AddRecurrentIncomeForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this recurrent income and all generated child incomes?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/recurrent-incomes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to delete recurrent income${details}`);
      }

      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recurrent income");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recurrent Incomes</h2>
          <p className="text-sm text-muted-foreground">Manage recurring income rules for active accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add recurrent income</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add recurrent income</DialogTitle>
                <DialogDescription>Create a recurring monthly income rule for an account.</DialogDescription>
              </DialogHeader>
              <AddRecurrentIncomeForm onAdded={refresh} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <RecurrentIncomesTable
        recurrentIncomes={recurrentIncomes}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

    </section>
  );
}
