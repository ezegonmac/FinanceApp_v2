'use client';

import { useEffect, useRef, useState } from "react";
import TransactionsTable from "./TransactionsTable";
import AddTransactionForm from "./AddTransactionForm";
import { Button } from "@/components/ui/button";
import MonthRangeFilter from "@/components/accounts/MonthRangeFilter";
import {
  getRangeForPreset,
  type MonthRangePreset,
} from "@/components/accounts/month-range-utils";
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
const CHUNK_SIZE = 30;
const PAGE_SIZE = 10;


export default function AccountTransactionsView({ accountId }: Props) {
  const defaultRange = getRangeForPreset("this-month");
  // Independent state for incoming and outgoing
  const [allIncoming, setAllIncoming] = useState<any[]>([]);
  const [incomingTotal, setIncomingTotal] = useState(0);
  const [incomingNextCursor, setIncomingNextCursor] = useState<number | null>(null);

  const [allOutgoing, setAllOutgoing] = useState<any[]>([]);
  const [outgoingTotal, setOutgoingTotal] = useState(0);
  const [outgoingNextCursor, setOutgoingNextCursor] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preset, setPreset] = useState<MonthRangePreset>("this-month");
  const [startMonth, setStartMonth] = useState(defaultRange.startMonth);
  const [endMonth, setEndMonth] = useState(defaultRange.endMonth);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetKey = `${accountId}-${startMonth}-${endMonth}-${refreshKey}`;

  useEffect(() => {
    setAllIncoming([]);
    setAllOutgoing([]);
    setIncomingNextCursor(null);
    setOutgoingNextCursor(null);
    setIncomingTotal(0);
    setOutgoingTotal(0);
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = `/api/accounts/${accountId}/transactions`;
        const query = new URLSearchParams({ startMonth, endMonth, limit: String(CHUNK_SIZE) });
        const [incomingRes, outgoingRes] = await Promise.all([
          fetch(`${base}?${query}&direction=incoming`),
          fetch(`${base}?${query}&direction=outgoing`),
        ]);
        if (cancelled) return;
        if (!incomingRes.ok || !outgoingRes.ok) throw new Error("Failed to fetch transactions");
        const [incoming, outgoing] = await Promise.all([incomingRes.json(), outgoingRes.json()]);
        setAllIncoming(incoming.data);
        setAllOutgoing(outgoing.data);
        setIncomingTotal(incoming.total);
        setOutgoingTotal(outgoing.total);
        setIncomingNextCursor(incoming.nextCursor);
        setOutgoingNextCursor(outgoing.nextCursor);
      } catch {
        if (!cancelled) setError("Failed to fetch transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void doFetch();
    return () => { cancelled = true; };
  }, [accountId, startMonth, endMonth, refreshKey]);

  const isLoadingMoreIncomingRef = useRef(false);
  const isLoadingMoreOutgoingRef = useRef(false);

  const handleIncomingPageChange = (pageIndex: number) => {
    const loadedPages = Math.ceil(allIncoming.length / PAGE_SIZE);
    if (!incomingNextCursor || isLoadingMoreIncomingRef.current || pageIndex < loadedPages - 2) return;
    isLoadingMoreIncomingRef.current = true;
    const params = new URLSearchParams({
      startMonth, endMonth, limit: String(CHUNK_SIZE),
      cursor: String(incomingNextCursor), direction: "incoming",
    });
    fetch(`/api/accounts/${accountId}/transactions?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((result: { data: any[]; total: number; nextCursor: number | null }) => {
        setAllIncoming(prev => [...prev, ...result.data]);
        setIncomingTotal(result.total);
        setIncomingNextCursor(result.nextCursor);
      })
      .catch(() => { /* prefetch fails silently */ })
      .finally(() => { isLoadingMoreIncomingRef.current = false; });
  };

  const handleOutgoingPageChange = (pageIndex: number) => {
    const loadedPages = Math.ceil(allOutgoing.length / PAGE_SIZE);
    if (!outgoingNextCursor || isLoadingMoreOutgoingRef.current || pageIndex < loadedPages - 2) return;
    isLoadingMoreOutgoingRef.current = true;
    const params = new URLSearchParams({
      startMonth, endMonth, limit: String(CHUNK_SIZE),
      cursor: String(outgoingNextCursor), direction: "outgoing",
    });
    fetch(`/api/accounts/${accountId}/transactions?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((result: { data: any[]; total: number; nextCursor: number | null }) => {
        setAllOutgoing(prev => [...prev, ...result.data]);
        setOutgoingTotal(result.total);
        setOutgoingNextCursor(result.nextCursor);
      })
      .catch(() => { /* prefetch fails silently */ })
      .finally(() => { isLoadingMoreOutgoingRef.current = false; });
  };

  const handleStartMonthChange = (value: string) => {
    setPreset("custom");
    setStartMonth(value);
    if (value > endMonth) setEndMonth(value);
  };

  const handleEndMonthChange = (value: string) => {
    setPreset("custom");
    setEndMonth(value);
    if (value < startMonth) setStartMonth(value);
  };

  const handlePresetChange = (value: MonthRangePreset) => {
    setPreset(value);
    const range = value === "custom" ? getRangeForPreset("this-month") : getRangeForPreset(value);
    setStartMonth(range.startMonth);
    setEndMonth(range.endMonth);
  };

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

      <MonthRangeFilter
        preset={preset}
        startMonth={startMonth}
        endMonth={endMonth}
        onChangePreset={handlePresetChange}
        onChangeStartMonth={handleStartMonthChange}
        onChangeEndMonth={handleEndMonthChange}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading transactions...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="space-y-3 overflow-hidden">
            <h3 className="text-lg font-medium">Incoming</h3>
            <TransactionsTable
              transactions={allIncoming}
              showMonth={true}
              showFromAccount={true}
              showToAccount={false}
              pageSize={PAGE_SIZE}
              totalCount={incomingTotal}
              resetKey={resetKey}
              onPageChange={handleIncomingPageChange}
              onDeleted={() => setRefreshKey(k => k + 1)}
            />
          </div>

          <div className="space-y-3 overflow-hidden">
            <h3 className="text-lg font-medium">Outgoing</h3>
            <TransactionsTable
              transactions={allOutgoing}
              showMonth={true}
              showFromAccount={false}
              showToAccount={true}
              pageSize={PAGE_SIZE}
              totalCount={outgoingTotal}
              resetKey={resetKey}
              onPageChange={handleOutgoingPageChange}
              onDeleted={() => setRefreshKey(k => k + 1)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
