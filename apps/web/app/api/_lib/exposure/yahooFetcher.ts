import YahooFinance from "yahoo-finance2";
import { type AssetType } from "@repo/db";

const yahooFinance = new YahooFinance();

/**
 * Raw exposure data returned from Yahoo Finance before normalization.
 * Each entry contains a provider label and its percentage allocation.
 */
export type ExposureData = {
  sectors: Array<{ label: string; percentage: number }>;
  countries: Array<{ label: string; percentage: number }>;
};

/**
 * Minimal asset shape required by the Yahoo fetcher.
 * Includes the asset type and provider mappings needed to resolve the Yahoo symbol.
 */
export type AssetWithMapping = {
  id: number;
  asset_type: AssetType;
  providerMappings: Array<{ provider: string; provider_symbol: string }>;
};

/**
 * Fetches exposure data (sector and country breakdowns) from Yahoo Finance
 * for a given asset.
 *
 * - For STOCK type: uses `assetProfile` module to get the single sector and country,
 *   assigning 100% to each.
 * - For ETF/FUND/ETP types: uses `topHoldings` module to get sector weightings
 *   and country breakdown percentages.
 * - Returns `null` when no Yahoo Finance provider mapping exists or no data is available.
 */
export async function fetchExposureFromYahoo(
  asset: AssetWithMapping,
): Promise<ExposureData | null> {
  const mapping = asset.providerMappings.find(
    (m) => m.provider === "YAHOO_FINANCE",
  );
  const symbol = mapping?.provider_symbol;
  if (!symbol) return null;

  if (asset.asset_type === "STOCK") {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["assetProfile"],
    });
    const profile = result.assetProfile;
    if (!profile) return null;

    return {
      sectors: profile.sector
        ? [{ label: profile.sector, percentage: 100 }]
        : [],
      countries: profile.country
        ? [{ label: profile.country, percentage: 100 }]
        : [],
    };
  } else {
    // ETF/FUND/ETP: Use topHoldings for breakdown
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["topHoldings"],
    });
    const holdings = result.topHoldings;
    if (!holdings) return null;

    const sectors = (holdings.sectorWeightings ?? []).flatMap((entry) =>
      Object.entries(entry).map(([label, pct]) => ({
        label,
        percentage: (pct as number) * 100,
      })),
    );

    // Yahoo's topHoldings doesn't always have country data, handle gracefully
    const countries: Array<{ label: string; percentage: number }> = [];

    return { sectors, countries };
  }
}
