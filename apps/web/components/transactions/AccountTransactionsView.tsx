'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionsTable from "./TransactionsTable";
import AddTransactionForm from "./AddTransactionForm";

type Props = {
  accountId: number;
};

export default function AccountTransactionsView({ accountId }: Props) {
  const router = useRouter();
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

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  const outgoingTransactions = transactions.filter(
    (transaction) => transaction.from_account_id === accountId
  );

  const incomingTransactions = transactions.filter(
    (transaction) => transaction.to_account_id === accountId
  );

  return (
    <>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <h3>Outgoing Transactions</h3>
          <TransactionsTable
            transactions={outgoingTransactions}
            showMonth={true}
            showFromAccount={false}
            showToAccount={true}
          />

          <br />

          <h3>Incoming Transactions</h3>
          <TransactionsTable
            transactions={incomingTransactions}
            showMonth={true}
            showFromAccount={true}
            showToAccount={false}
          />
        </>
      )}
      <br />
      <AddTransactionForm accountId={accountId} onAdded={refresh} />
      &nbsp;
      <button onClick={refresh} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
