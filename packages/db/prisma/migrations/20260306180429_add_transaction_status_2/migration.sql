/*
  Warnings:

  - You are about to drop the column `transaction_status` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `transaction_status`,
    ADD COLUMN `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `Transaction_effective_date_status_idx` ON `Transaction`(`effective_date`, `status`);
