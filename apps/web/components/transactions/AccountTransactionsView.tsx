'use client';

import { useEffect, useState } from "react";
import TransactionsTable from "./TransactionsTable";
import AddTransactionForm from "./AddTransactionForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  accountId: number;
};

export default function AccountTransactionsView({ accountId }: Props) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void fetchTransactions();
  }, [accountId]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounts/${accountId}/transactions`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      setTransactions(await response.json());
    } catch {
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchTransactions();
  };

  const outgoingTransactions = transactions.filter(
    (transaction) => transaction.from_account_id === accountId
  );

  const incomingTransactions = transactions.filter(
    (transaction) => transaction.to_account_id === accountId
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Transactions</h2>
          <p className="text-sm text-muted-foreground">Transfers in and out of this account.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add transaction</DialogTitle>
                <DialogDescription>Create a transfer from this account to another active account.</DialogDescription>
              </DialogHeader>
              <AddTransactionForm accountId={accountId} onAdded={() => void refresh()} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading transactions...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
          <h3 className="text-lg font-medium">Outgoing transactions</h3>
          <TransactionsTable
            transactions={outgoingTransactions}
            showMonth={true}
            showFromAccount={false}
            showToAccount={true}
            onDeleted={refresh}
          />
          </div>

          <div className="space-y-3">
          <h3 className="text-lg font-medium">Incoming transactions</h3>
          <TransactionsTable
            transactions={incomingTransactions}
            showMonth={true}
            showFromAccount={true}
            showToAccount={false}
            onDeleted={refresh}
          />
          </div>
        </div>
      )}
    </section>
  );
}
