-- CreateTable
CREATE TABLE `ExposureCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exposure_type` ENUM('SECTOR', 'COUNTRY') NOT NULL,
    `canonical_key` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExposureCategory_exposure_type_canonical_key_key`(`exposure_type`, `canonical_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExposureCategoryMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('YAHOO_FINANCE') NOT NULL,
    `provider_label` VARCHAR(200) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExposureCategoryMapping_provider_provider_label_idx`(`provider`, `provider_label`),
    UNIQUE INDEX `ExposureCategoryMapping_provider_provider_label_category_id_key`(`provider`, `provider_label`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetExposureSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `exposure_type` ENUM('SECTOR', 'COUNTRY') NOT NULL,
    `category_id` INTEGER NOT NULL,
    `percentage` DECIMAL(7, 4) NOT NULL,
    `provider` ENUM('YAHOO_FINANCE') NOT NULL,
    `synced_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssetExposureSnapshot_asset_id_period_exposure_type_idx`(`asset_id`, `period`, `exposure_type`),
    UNIQUE INDEX `AssetExposureSnapshot_asset_id_period_exposure_type_category_key`(`asset_id`, `period`, `exposure_type`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExposureCategoryMapping` ADD CONSTRAINT `ExposureCategoryMapping_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `ExposureCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetExposureSnapshot` ADD CONSTRAINT `AssetExposureSnapshot_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetExposureSnapshot` ADD CONSTRAINT `AssetExposureSnapshot_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `ExposureCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
