'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import type { Asset } from "@repo/db";

type AssetSearchResult = {
  ticker: string;
  name: string;
  asset_type: "FUND" | "ETF" | "ETP" | "STOCK" | "CRYPTO";
  exchange: string;
  currency: string;
};

type Props = {
  onAssetAdded: (asset: Asset) => void;
};

function determineFrequency(assetType: AssetSearchResult["asset_type"]): "DAILY" | "INTRADAY" {
  return assetType === "FUND" ? "DAILY" : "INTRADAY";
}

export function AssetSearch({ onAssetAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Dismiss error on new keystroke
    setError(null);

    // Don't search if query is empty
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `/api/financial-products/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setShowDropdown(false);
          setError("Failed to search assets. Please try again.");
          setLoading(false);
          return;
        }

        const data: AssetSearchResult[] = await response.json();
        setResults(data);
        setShowDropdown(true);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled — do nothing
          return;
        }
        setShowDropdown(false);
        setError("Network error. Please check your connection.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);
  }, [query]);

  const handleSelect = useCallback(
    async (result: AssetSearchResult) => {
      setShowDropdown(false);
      setError(null);

      try {
        const response = await fetch("/api/financial-products/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: result.ticker,
            name: result.name,
            asset_type: result.asset_type,
            price_frequency: determineFrequency(result.asset_type),
            currency: result.currency || "USD",
            provider_symbol: result.ticker,
          }),
        });

        if (!response.ok) {
          setError("Failed to track asset. Please try again.");
          return;
        }

        const asset: Asset = await response.json();
        onAssetAdded(asset);
        setQuery("");
        setResults([]);
      } catch {
        setError("Network error. Could not track asset.");
      }
    },
    [onAssetAdded]
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search assets..."
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Search financial assets"
        aria-expanded={showDropdown}
        role="combobox"
        aria-controls="asset-search-listbox"
        aria-autocomplete="list"
      />

      {loading && query.trim() && (
        <div className="absolute right-3 top-2.5">
          <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}

      {showDropdown && (
        <div
          id="asset-search-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
        >
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((result) => (
                <li
                  key={`${result.ticker}-${result.exchange}`}
                  role="option"
                  aria-selected={false}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelect(result)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{result.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {result.ticker}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {result.exchange}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
