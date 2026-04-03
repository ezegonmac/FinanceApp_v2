'use client';

import { useEffect, useState } from "react";
import IncomesTable from "./IncomesTable";
import AddIncomeForm from "./AddIncomeForm";
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

export default function AccountIncomesView({ accountId }: Props) {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void fetchIncomes();
  }, [accountId]);

  const fetchIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounts/${accountId}/incomes`);
      if (!response.ok) throw new Error("Failed to fetch incomes");
      setIncomes(await response.json());
    } catch {
      setError("Failed to fetch incomes");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchIncomes();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Incomes</h2>
          <p className="text-sm text-muted-foreground">Income entries associated with this account.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add income</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add income</DialogTitle>
                <DialogDescription>Create a new income for this account.</DialogDescription>
              </DialogHeader>
              <AddIncomeForm accountId={accountId} onAdded={() => void refresh()} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <IncomesTable incomes={incomes} loading={loading} error={error} showMonth={true} showAccount={false} onDeleted={refresh} />
    </section>
  );
}
