-- CreateTable
CREATE TABLE `RecurrentTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_account_id` INTEGER NOT NULL,
    `to_account_id` INTEGER NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `start_month` DATETIME(3) NULL,
    `end_month` DATETIME(3) NULL,
    `next_run_year` INTEGER NULL,
    `next_run_month` INTEGER NULL,
    `last_applied_month_id` INTEGER NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RecurrentTransaction_from_account_id_status_idx`(`from_account_id`, `status`),
    INDEX `RecurrentTransaction_to_account_id_status_idx`(`to_account_id`, `status`),
    INDEX `RecurrentTransaction_next_run_year_next_run_month_idx`(`next_run_year`, `next_run_month`),
    INDEX `RecurrentTransaction_last_applied_month_id_idx`(`last_applied_month_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurrentTransactionRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recurrent_transaction_id` INTEGER NOT NULL,
    `month_id` INTEGER NOT NULL,
    `transaction_id` INTEGER NULL,
    `job_run_id` INTEGER NULL,
    `status` ENUM('APPLIED', 'FAILED') NOT NULL,
    `processing_error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `RecurrentTransactionRun_month_id_idx`(`month_id`),
    INDEX `RecurrentTransactionRun_job_run_id_idx`(`job_run_id`),
    INDEX `RecurrentTransactionRun_status_idx`(`status`),
    UNIQUE INDEX `RecurrentTransactionRun_recurrent_transaction_id_month_id_key`(`recurrent_transaction_id`, `month_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecurrentTransaction` ADD CONSTRAINT `RecurrentTransaction_from_account_id_fkey` FOREIGN KEY (`from_account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentTransaction` ADD CONSTRAINT `RecurrentTransaction_to_account_id_fkey` FOREIGN KEY (`to_account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentTransaction` ADD CONSTRAINT `RecurrentTransaction_last_applied_month_id_fkey` FOREIGN KEY (`last_applied_month_id`) REFERENCES `Month`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentTransactionRun` ADD CONSTRAINT `RecurrentTransactionRun_recurrent_transaction_id_fkey` FOREIGN KEY (`recurrent_transaction_id`) REFERENCES `RecurrentTransaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentTransactionRun` ADD CONSTRAINT `RecurrentTransactionRun_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentTransactionRun` ADD CONSTRAINT `RecurrentTransactionRun_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `Transaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentTransactionRun` ADD CONSTRAINT `RecurrentTransactionRun_job_run_id_fkey` FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
