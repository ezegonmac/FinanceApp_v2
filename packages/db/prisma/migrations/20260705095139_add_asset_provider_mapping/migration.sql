/*
  Warnings:

  - A unique constraint covering the columns `[isin]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Asset_ticker_key` ON `Asset`;

-- CreateTable
CREATE TABLE `AssetProviderMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `provider` ENUM('YAHOO_FINANCE') NOT NULL,
    `provider_symbol` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AssetProviderMapping_asset_id_provider_key`(`asset_id`, `provider`),
    UNIQUE INDEX `AssetProviderMapping_provider_provider_symbol_key`(`provider`, `provider_symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Asset_isin_key` ON `Asset`(`isin`);

-- AddForeignKey
ALTER TABLE `AssetProviderMapping` ADD CONSTRAINT `AssetProviderMapping_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
