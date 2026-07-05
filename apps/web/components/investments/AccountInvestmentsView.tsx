'use client';

import { useEffect, useRef, useState } from "react";
import InvestmentsTable, { type InvestmentRow } from "./InvestmentsTable";
import AddInvestmentForm from "./AddInvestmentForm";
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

interface InvestmentsListResponse {
  data: InvestmentRow[];
  total: number;
  nextCursor: number | null;
}

const CHUNK_SIZE = 30;
const PAGE_SIZE = 10;

export default function AccountInvestmentsView({ accountId }: Props) {
  const [allData, setAllData] = useState<InvestmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetKey = `${accountId}-${refreshKey}`;

  useEffect(() => {
    setAllData([]);
    setNextCursor(null);
    setTotal(0);
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: String(CHUNK_SIZE) });
        const res = await fetch(`/api/accounts/${accountId}/investments?${params}`);
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to fetch investments");
        const result: InvestmentsListResponse = await res.json();
        setAllData(result.data);
        setTotal(result.total);
        setNextCursor(result.nextCursor);
      } catch {
        if (!cancelled) setError("Failed to fetch investments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void doFetch();
    return () => { cancelled = true; };
  }, [accountId, refreshKey]);

  const isLoadingMoreRef = useRef(false);

  const handlePageChange = (pageIndex: number) => {
    const loadedPages = Math.ceil(allData.length / PAGE_SIZE);
    if (!nextCursor || isLoadingMoreRef.current || pageIndex < loadedPages - 2) return;
    isLoadingMoreRef.current = true;
    const params = new URLSearchParams({
      limit: String(CHUNK_SIZE),
      cursor: String(nextCursor),
    });
    fetch(`/api/accounts/${accountId}/investments?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((result: InvestmentsListResponse) => {
        setAllData(prev => [...prev, ...result.data]);
        setTotal(result.total);
        setNextCursor(result.nextCursor);
      })
      .catch(() => { /* prefetch fails silently */ })
      .finally(() => { isLoadingMoreRef.current = false; });
  };

  const handleCancel = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}/investments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investment_id: id, action: "cancel" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Failed to cancel investment");
      }
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel investment");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Investments</h2>
          <p className="text-sm text-muted-foreground">Investment operations associated with this account.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add investment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add investment</DialogTitle>
                <DialogDescription>Create a new investment operation for this account.</DialogDescription>
              </DialogHeader>
              <AddInvestmentForm
                accountId={accountId}
                onAdded={() => {
                  setIsDialogOpen(false);
                  setRefreshKey(k => k + 1);
                }}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <InvestmentsTable
        investments={allData}
        loading={loading}
        error={error}
        pageSize={PAGE_SIZE}
        totalCount={total}
        resetKey={resetKey}
        onPageChange={handlePageChange}
        onCancel={handleCancel}
      />
    </section>
  );
}
