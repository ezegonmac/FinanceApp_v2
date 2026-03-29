-- CreateTable
CREATE TABLE `RecurrentIncome` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RecurrentIncome_account_id_active_idx`(`account_id`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurrentIncomeRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recurrent_income_id` INTEGER NOT NULL,
    `month_id` INTEGER NOT NULL,
    `income_id` INTEGER NULL,
    `job_run_id` INTEGER NULL,
    `status` ENUM('APPLIED', 'FAILED') NOT NULL,
    `processing_error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `RecurrentIncomeRun_month_id_idx`(`month_id`),
    INDEX `RecurrentIncomeRun_job_run_id_idx`(`job_run_id`),
    INDEX `RecurrentIncomeRun_status_idx`(`status`),
    UNIQUE INDEX `RecurrentIncomeRun_recurrent_income_id_month_id_key`(`recurrent_income_id`, `month_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecurrentIncome` ADD CONSTRAINT `RecurrentIncome_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentIncomeRun` ADD CONSTRAINT `RecurrentIncomeRun_recurrent_income_id_fkey` FOREIGN KEY (`recurrent_income_id`) REFERENCES `RecurrentIncome`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentIncomeRun` ADD CONSTRAINT `RecurrentIncomeRun_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentIncomeRun` ADD CONSTRAINT `RecurrentIncomeRun_income_id_fkey` FOREIGN KEY (`income_id`) REFERENCES `Income`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentIncomeRun` ADD CONSTRAINT `RecurrentIncomeRun_job_run_id_fkey` FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
