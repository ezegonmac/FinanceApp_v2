'use client';

import { useEffect, useState } from "react";
import AddRecurrentExpenseForm from "./AddRecurrentExpenseForm";
import RecurrentExpensesTable from "./RecurrentExpensesTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recurrent Expenses</h2>
          <p className="text-sm text-muted-foreground">Manage recurring expense rules for active accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add recurrent expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add recurrent expense</DialogTitle>
                <DialogDescription>Create a recurring monthly expense rule for an account.</DialogDescription>
              </DialogHeader>
              <AddRecurrentExpenseForm onAdded={refresh} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <RecurrentExpensesTable
        recurrentExpenses={recurrentExpenses}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

    </section>
  );
}
