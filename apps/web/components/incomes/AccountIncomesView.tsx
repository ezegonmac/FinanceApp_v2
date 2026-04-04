'use client';

import { useEffect, useRef, useState } from "react";
import IncomesTable from "./IncomesTable";
import AddIncomeForm from "./AddIncomeForm";
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


export default function AccountIncomesView({ accountId }: Props) {
  const defaultRange = getRangeForPreset("this-month");
  const [allData, setAllData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preset, setPreset] = useState<MonthRangePreset>("this-month");
  const [startMonth, setStartMonth] = useState(defaultRange.startMonth);
  const [endMonth, setEndMonth] = useState(defaultRange.endMonth);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetKey = `${accountId}-${startMonth}-${endMonth}-${refreshKey}`;

  // Initial / filter-change fetch — resets buffer
  useEffect(() => {
    setAllData([]);
    setNextCursor(null);
    setTotal(0);
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ startMonth, endMonth, limit: String(CHUNK_SIZE) });
        const res = await fetch(`/api/accounts/${accountId}/incomes?${params}`);
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to fetch incomes");
        const result = await res.json();
        setAllData(result.data);
        setTotal(result.total);
        setNextCursor(result.nextCursor);
      } catch {
        if (!cancelled) setError("Failed to fetch incomes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void doFetch();
    return () => { cancelled = true; };
  }, [accountId, startMonth, endMonth, refreshKey]);

  // Ref guards prevent duplicate in-flight prefetch calls
  const isLoadingMoreRef = useRef(false);

  const handlePageChange = (pageIndex: number) => {
    const loadedPages = Math.ceil(allData.length / PAGE_SIZE);
    if (!nextCursor || isLoadingMoreRef.current || pageIndex < loadedPages - 2) return;
    isLoadingMoreRef.current = true;
    const params = new URLSearchParams({
      startMonth, endMonth, limit: String(CHUNK_SIZE), cursor: String(nextCursor),
    });
    fetch(`/api/accounts/${accountId}/incomes?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((result: { data: any[]; total: number; nextCursor: number | null }) => {
        setAllData(prev => [...prev, ...result.data]);
        setTotal(result.total);
        setNextCursor(result.nextCursor);
      })
      .catch(() => { /* prefetch fails silently */ })
      .finally(() => { isLoadingMoreRef.current = false; });
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

      <MonthRangeFilter
        preset={preset}
        startMonth={startMonth}
        endMonth={endMonth}
        onChangePreset={handlePresetChange}
        onChangeStartMonth={handleStartMonthChange}
        onChangeEndMonth={handleEndMonthChange}
      />

      <IncomesTable
        incomes={allData}
        loading={loading}
        error={error}
        showMonth={true}
        showAccount={false}
        pageSize={PAGE_SIZE}
        totalCount={total}
        resetKey={resetKey}
        onPageChange={handlePageChange}
        onDeleted={() => setRefreshKey(k => k + 1)}
      />
    </section>
  );
}
