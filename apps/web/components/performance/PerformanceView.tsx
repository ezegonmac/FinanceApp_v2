"use client";

import { useState } from "react";
import PerformanceSummaryCards from "@/components/performance/PerformanceSummaryCards";
import { PortfolioValueChart } from "@/components/performance/PortfolioValueChart";
import PositionsTable from "@/components/performance/PositionsTable";
import AssetPerformanceDetail from "@/components/performance/AssetPerformanceDetail";

type PerformanceData = {
  summary: {
    total_invested: string;
    total_current_value: string;
    total_pnl: string;
    total_pnl_pct: string;
    twr: string;
    daily_change: string;
    daily_change_pct: string;
    previous_value: string;
  };
  positions: Array<{
    asset_id: number;
    asset: { ticker: string; name: string; asset_type: string; currency: string };
    total_units: string;
    total_invested: string;
    avg_cost: string;
    current_price: string;
    current_value: string;
    unrealized_pnl: string;
    unrealized_pct: string;
    weight: string;
    daily_change: string;
    daily_change_pct: string;
    price_updated_at: string | null;
  }>;
};

type PerformanceViewProps = {
  data: PerformanceData;
};

export function PerformanceView({ data }: PerformanceViewProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portfolio Performance</h1>
      <PerformanceSummaryCards summary={data.summary} />
      <PortfolioValueChart />
      <PositionsTable
        positions={data.positions}
        selectedAssetId={selectedAssetId}
        onSelectAsset={setSelectedAssetId}
      />
      {selectedAssetId !== null && (
        <AssetPerformanceDetail assetId={selectedAssetId} />
      )}
    </div>
  );
}
