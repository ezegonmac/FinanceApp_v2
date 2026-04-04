'use client';

import { useEffect, useState } from "react";
import AddRecurrentTransactionForm from "./AddRecurrentTransactionForm";
import RecurrentTransactionsTable from "./RecurrentTransactionsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type RecurrentTransaction = {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  start_month: string | null;
  end_month: string | null;
  next_run_year: number | null;
  next_run_month: number | null;
  last_applied_month_id: number | null;
  created_at: string;
  from_account_name?: string;
  to_account_name?: string;
};

export default function RecurrentTransactionsView() {
  const [recurrentTransactions, setRecurrentTransactions] = useState<RecurrentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchRecurrentTransactions();
  }, [refreshKey]);

  const fetchRecurrentTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recurrent-transactions");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to fetch recurrent transactions${details}`);
      }
      setRecurrentTransactions(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recurrent transactions");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this recurrent transaction and all generated child transactions?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/recurrent-transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to delete recurrent transaction${details}`);
      }

      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recurrent transaction");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recurrent Transactions</h2>
          <p className="text-sm text-muted-foreground">Manage recurring transfers between accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add recurrent transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add recurrent transaction</DialogTitle>
                <DialogDescription>Create a recurring monthly transfer between two accounts.</DialogDescription>
              </DialogHeader>
              <AddRecurrentTransactionForm onAdded={refresh} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <RecurrentTransactionsTable
        recurrentTransactions={recurrentTransactions}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

    </section>
  );
}
