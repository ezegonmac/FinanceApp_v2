-- AlterTable
ALTER TABLE `MonthSnapshot` ADD COLUMN `total_investments_in` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `total_investments_out` DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Investment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `month_id` INTEGER NOT NULL,
    `job_run_id` INTEGER NULL,
    `type` ENUM('BUY', 'SELL') NOT NULL,
    `units` DECIMAL(18, 6) NOT NULL,
    `unit_price` DECIMAL(18, 6) NOT NULL,
    `total_amount` DECIMAL(18, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `processing_error` VARCHAR(191) NULL,

    INDEX `Investment_account_id_asset_id_status_idx`(`account_id`, `asset_id`, `status`),
    INDEX `Investment_month_id_status_idx`(`month_id`, `status`),
    INDEX `Investment_job_run_id_idx`(`job_run_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_job_run_id_fkey` FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
