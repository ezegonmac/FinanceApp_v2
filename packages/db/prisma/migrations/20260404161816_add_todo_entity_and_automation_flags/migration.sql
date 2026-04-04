-- AlterTable
ALTER TABLE `RecurrentExpense` ADD COLUMN `automated` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `RecurrentTransaction` ADD COLUMN `automated` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `Todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('EXPENSE', 'TRANSACTION') NOT NULL,
    `origin` ENUM('MANUAL', 'RECURRENT') NOT NULL,
    `status` ENUM('OPEN', 'DONE', 'SKIPPED') NOT NULL DEFAULT 'OPEN',
    `due_year` INTEGER NOT NULL,
    `due_month` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NULL,
    `skip_reason` VARCHAR(191) NULL,
    `completed_at` DATETIME(3) NULL,
    `action_error` VARCHAR(191) NULL,
    `job_run_id` INTEGER NULL,
    `account_id` INTEGER NULL,
    `from_account_id` INTEGER NULL,
    `to_account_id` INTEGER NULL,
    `recurrent_expense_id` INTEGER NULL,
    `recurrent_transaction_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Todo_status_due_year_due_month_idx`(`status`, `due_year`, `due_month`),
    INDEX `Todo_origin_status_idx`(`origin`, `status`),
    INDEX `Todo_recurrent_expense_id_due_year_due_month_idx`(`recurrent_expense_id`, `due_year`, `due_month`),
    INDEX `Todo_recurrent_transaction_id_due_year_due_month_idx`(`recurrent_transaction_id`, `due_year`, `due_month`),
    UNIQUE INDEX `Todo_recurrent_expense_id_due_year_due_month_key`(`recurrent_expense_id`, `due_year`, `due_month`),
    UNIQUE INDEX `Todo_recurrent_transaction_id_due_year_due_month_key`(`recurrent_transaction_id`, `due_year`, `due_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_from_account_id_fkey` FOREIGN KEY (`from_account_id`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_to_account_id_fkey` FOREIGN KEY (`to_account_id`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_recurrent_expense_id_fkey` FOREIGN KEY (`recurrent_expense_id`) REFERENCES `RecurrentExpense`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_recurrent_transaction_id_fkey` FOREIGN KEY (`recurrent_transaction_id`) REFERENCES `RecurrentTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_job_run_id_fkey` FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
