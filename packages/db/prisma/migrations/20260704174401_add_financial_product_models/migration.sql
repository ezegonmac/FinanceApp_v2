-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticker` VARCHAR(191) NOT NULL,
    `isin` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `asset_type` ENUM('FUND', 'ETF', 'ETP', 'STOCK', 'CRYPTO') NOT NULL,
    `price_frequency` ENUM('DAILY', 'INTRADAY') NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Asset_ticker_key`(`ticker`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetPrice` (
    `asset_id` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `price` DECIMAL(18, 6) NOT NULL,
    `granularity` ENUM('DAILY', 'HOURLY', 'FIFTEEN_MIN', 'WEEKLY') NOT NULL,

    INDEX `AssetPrice_asset_id_timestamp_idx`(`asset_id`, `timestamp`),
    UNIQUE INDEX `AssetPrice_asset_id_timestamp_granularity_key`(`asset_id`, `timestamp`, `granularity`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetPriceSyncRange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `granularity` ENUM('DAILY', 'HOURLY', 'FIFTEEN_MIN', 'WEEKLY') NOT NULL,
    `from_timestamp` DATETIME(3) NOT NULL,
    `until_timestamp` DATETIME(3) NOT NULL,
    `synced_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssetPriceSyncRange_asset_id_granularity_idx`(`asset_id`, `granularity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AssetPrice` ADD CONSTRAINT `AssetPrice_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetPriceSyncRange` ADD CONSTRAINT `AssetPriceSyncRange_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
