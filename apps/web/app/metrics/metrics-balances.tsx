"use client";

import { useEffect, useState } from "react";
import AccountBalancesTable from "@/components/metrics/AccountBalancesTable";

type BalancesData = {
  accounts: { id: number; name: string; balance: string }[];
  total: number;
};

export default function MetricsBalances() {
  const [data, setData] = useState<BalancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/metrics/balances")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load balances."); setLoading(false); });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return <AccountBalancesTable accounts={data.accounts} total={data.total} />;
}
