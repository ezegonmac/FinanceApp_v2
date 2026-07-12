-- CreateTable
CREATE TABLE `RecurrentInvestment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `type` ENUM('BUY', 'SELL') NOT NULL,
    `total_amount` DECIMAL(18, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `automated` BOOLEAN NOT NULL DEFAULT true,
    `start_month` DATETIME(3) NULL,
    `end_month` DATETIME(3) NULL,
    `next_run_year` INTEGER NULL,
    `next_run_month` INTEGER NULL,
    `last_applied_month_id` INTEGER NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RecurrentInvestment_account_id_status_idx`(`account_id`, `status`),
    INDEX `RecurrentInvestment_next_run_year_next_run_month_idx`(`next_run_year`, `next_run_month`),
    INDEX `RecurrentInvestment_last_applied_month_id_idx`(`last_applied_month_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurrentInvestmentRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recurrent_investment_id` INTEGER NOT NULL,
    `month_id` INTEGER NOT NULL,
    `investment_id` INTEGER NULL,
    `job_run_id` INTEGER NULL,
    `status` ENUM('APPLIED', 'FAILED') NOT NULL,
    `processing_error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RecurrentInvestmentRun_recurrent_investment_id_month_id_key`(`recurrent_investment_id`, `month_id`),
    INDEX `RecurrentInvestmentRun_month_id_idx`(`month_id`),
    INDEX `RecurrentInvestmentRun_job_run_id_idx`(`job_run_id`),
    INDEX `RecurrentInvestmentRun_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecurrentInvestment` ADD CONSTRAINT `RecurrentInvestment_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentInvestment` ADD CONSTRAINT `RecurrentInvestment_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Asset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentInvestment` ADD CONSTRAINT `RecurrentInvestment_last_applied_month_id_fkey` FOREIGN KEY (`last_applied_month_id`) REFERENCES `Month`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentInvestmentRun` ADD CONSTRAINT `RecurrentInvestmentRun_recurrent_investment_id_fkey` FOREIGN KEY (`recurrent_investment_id`) REFERENCES `RecurrentInvestment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentInvestmentRun` ADD CONSTRAINT `RecurrentInvestmentRun_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentInvestmentRun` ADD CONSTRAINT `RecurrentInvestmentRun_investment_id_fkey` FOREIGN KEY (`investment_id`) REFERENCES `Investment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentInvestmentRun` ADD CONSTRAINT `RecurrentInvestmentRun_job_run_id_fkey` FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
