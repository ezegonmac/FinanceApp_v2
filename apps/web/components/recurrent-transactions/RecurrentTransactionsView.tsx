'use client';

import { useEffect, useState } from "react";
import AddRecurrentTransactionForm from "./AddRecurrentTransactionForm";
import RecurrentTransactionsTable from "./RecurrentTransactionsTable";
import RecurrentStatusFilter from "@/components/accounts/RecurrentStatusFilter";
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
  automated: boolean;
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

type RecurrentStatus = "ALL" | "ACTIVE" | "PAUSED" | "CANCELLED";

const PAGE_SIZE = 15;

export default function RecurrentTransactionsView() {
  const [recurrentTransactions, setRecurrentTransactions] = useState<RecurrentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [status, setStatus] = useState<RecurrentStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchRecurrentTransactions();
  }, [refreshKey, status, currentPage]);

  const fetchRecurrentTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status,
        limit: String(PAGE_SIZE),
        skip: String(currentPage * PAGE_SIZE),
      });

      const response = await fetch(`/api/recurrent-transactions?${params}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details ? ` (${payload.details})` : "";
        throw new Error(`Failed to fetch recurrent transactions${details}`);
      }
      const { data, total: totalCount } = await response.json();
      setRecurrentTransactions(data);
      setTotal(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recurrent transactions");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setCurrentPage(0);
    setRefreshKey((k) => k + 1);
  };

  const handleStatusChange = (newStatus: RecurrentStatus) => {
    setStatus(newStatus);
    setCurrentPage(0);
  };

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

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

      <RecurrentStatusFilter value={status} onChange={handleStatusChange} />

      <RecurrentTransactionsTable
        recurrentTransactions={recurrentTransactions}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        deletingId={deletingId}
        pageSize={PAGE_SIZE}
        totalCount={total}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-muted/50 px-3 py-2 rounded-md">
          <p className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
