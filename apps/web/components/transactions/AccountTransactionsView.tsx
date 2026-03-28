'use client';

import { useEffect, useState } from "react";
import TransactionsTable from "./TransactionsTable";
import AddTransactionForm from "./AddTransactionForm";

type Props = {
  accountId: number;
};

export default function AccountTransactionsView({ accountId }: Props) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [refreshKey]);

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

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <>
      <TransactionsTable transactions={transactions} loading={loading} error={error} showMonth={true} showAccount={false} />
      <br />
      <AddTransactionForm accountId={accountId} onAdded={refresh} />
      &nbsp;
      <button onClick={refresh} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
