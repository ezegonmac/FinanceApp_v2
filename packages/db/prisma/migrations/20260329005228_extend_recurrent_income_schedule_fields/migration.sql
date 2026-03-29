/*
  Warnings:

  - You are about to drop the column `active` on the `RecurrentIncome` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `RecurrentIncome` DROP FOREIGN KEY `RecurrentIncome_account_id_fkey`;

-- DropIndex
DROP INDEX `RecurrentIncome_account_id_active_idx` ON `RecurrentIncome`;

-- AlterTable
ALTER TABLE `RecurrentIncome` DROP COLUMN `active`,
    ADD COLUMN `end_month` DATETIME(3) NULL,
    ADD COLUMN `last_applied_month_id` INTEGER NULL,
    ADD COLUMN `next_run_month` INTEGER NULL,
    ADD COLUMN `next_run_year` INTEGER NULL,
    ADD COLUMN `start_month` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX `RecurrentIncome_account_id_status_idx` ON `RecurrentIncome`(`account_id`, `status`);

-- CreateIndex
CREATE INDEX `RecurrentIncome_next_run_year_next_run_month_idx` ON `RecurrentIncome`(`next_run_year`, `next_run_month`);

-- CreateIndex
CREATE INDEX `RecurrentIncome_last_applied_month_id_idx` ON `RecurrentIncome`(`last_applied_month_id`);

-- AddForeignKey
ALTER TABLE `RecurrentIncome` ADD CONSTRAINT `RecurrentIncome_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrentIncome` ADD CONSTRAINT `RecurrentIncome_last_applied_month_id_fkey` FOREIGN KEY (`last_applied_month_id`) REFERENCES `Month`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
