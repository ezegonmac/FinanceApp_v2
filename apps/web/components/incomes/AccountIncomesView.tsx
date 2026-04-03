'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IncomesTable from "./IncomesTable";
import AddIncomeForm from "./AddIncomeForm";

type Props = {
  accountId: number;
};

export default function AccountIncomesView({ accountId }: Props) {
  const router = useRouter();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchIncomes();
  }, [refreshKey]);

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

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  return (
    <>
      <IncomesTable incomes={incomes} loading={loading} error={error} showMonth={true} showAccount={false} onDeleted={refresh} />
      <br />
      <AddIncomeForm accountId={accountId} onAdded={refresh} />
      &nbsp;
      <button onClick={refresh} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
