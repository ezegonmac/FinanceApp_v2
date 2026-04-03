'use client';

import { useEffect, useState } from "react";
import ExpensesTable from "./ExpensesTable";
import AddExpenseForm from "./AddExpenseForm";
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

export default function AccountExpensesView({ accountId }: Props) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void fetchExpenses();
  }, [accountId]);

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

  const refresh = async () => {
    await fetchExpenses();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Expenses</h2>
          <p className="text-sm text-muted-foreground">Expense entries associated with this account.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add expense</DialogTitle>
                <DialogDescription>Create a new expense for this account.</DialogDescription>
              </DialogHeader>
              <AddExpenseForm accountId={accountId} onAdded={() => void refresh()} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ExpensesTable expenses={expenses} loading={loading} error={error} showMonth={true} showAccount={false} onDeleted={refresh} />
    </section>
  );
}
