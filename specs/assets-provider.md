# Asset Provider Mapping

> Backlog entry: `- Asset Provider Mapping 🟨 [spec:assets-provider]`

## Goal

Separate asset identity (ISIN) from provider-specific symbols (Yahoo, Morningstar, etc.) so the same real-world fund/stock is never duplicated when different providers use different tickers for it.

## Requirements

- The system shall store asset identity using ISIN as the primary deduplication key (when available).
- The system shall store provider symbols in a separate `AssetProviderMapping` table with a unique constraint on `(asset_id, provider)`.
- When creating an asset, the system shall check ISIN for an existing match before checking ticker.
- The system shall support multiple provider mappings per asset (e.g. Yahoo, Morningstar, Vanguard).
- The price sync algorithm shall resolve the Yahoo symbol from the provider mapping table instead of reading `Asset.ticker` directly.
- The search flow shall present candidates to the user for confirmation instead of blindly saving the first Yahoo result.
- The `POST /assets` endpoint shall accept a `provider_symbol` field and create the mapping atomically with the asset.

## Acceptance Criteria

```
Given an asset with ISIN IE0031786696 already exists
When  the user tracks a different Yahoo symbol that maps to the same ISIN
Then  the system returns the existing asset and adds a new provider mapping
```

```
Given an asset is tracked with provider_symbol "0P00012I6A.F"
When  the price sync runs for that asset
Then  the system fetches prices using "0P00012I6A.F" from the mapping table
```

```
Given a user searches for "IE0031786696"
When  Yahoo returns multiple candidates
Then  the UI shows all candidates for the user to pick the correct one
```

## Edge Cases

- What happens when an asset has no ISIN (e.g. crypto) — fall back to ticker-based dedup.
- What happens when the same Yahoo symbol is mapped to two different assets — reject with a conflict error.
- What happens when a provider mapping is deleted — prices already fetched remain, but future syncs fail gracefully until a new mapping is added.

## Out of Scope

- Automatic ISIN resolution from external registries.
- Multi-provider price sync (only Yahoo for now; mappings for other providers are stored but unused).
- Migrating existing `Asset.ticker` data (manual one-time script, not part of this feature).

## Notes

- The `Asset.ticker` column can be kept as a display-friendly label but should no longer be the dedup key.
- New model: `AssetProviderMapping { id, asset_id, provider (enum), provider_symbol (string), created_at }` with unique on `(asset_id, provider)` and unique on `(provider, provider_symbol)`.
- Provider enum starts with `YAHOO_FINANCE` only; extend later.
- The `currency` field in `AssetSearch` is currently hardcoded to `"USD"` — this feature should also pull currency from Yahoo search results.
