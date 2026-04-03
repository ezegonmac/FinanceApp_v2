-- AlterTable
ALTER TABLE `Expense` ADD COLUMN `analytics_amount` DECIMAL(18, 2) NULL;

-- AlterTable
ALTER TABLE `RecurrentExpense` ADD COLUMN `analytics_amount` DECIMAL(18, 2) NULL;
