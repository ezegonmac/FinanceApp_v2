
# TODO: Financial Products Background Sync

<!-- TODO: Implement a background cron job at /api/internal/jobs/sync-financial-products
     that incrementally refreshes price data for all tracked financial assets on a schedule.
     This job should:
     - Query all tracked assets from the DB
     - For each asset, call syncPrices with the appropriate timeframe to fill any gaps
     - Run daily (or more frequently for intraday assets)
     - Be idempotent (safe to run multiple times)
     - Use the same Bearer CRON_SECRET authorization pattern as apply-pending-transactions
     
     Example cron entry:
     0 */4 * * * curl -X POST http://localhost:3000/api/internal/jobs/sync-financial-products -H "Authorization: Bearer <CRON_SECRET>"
-->