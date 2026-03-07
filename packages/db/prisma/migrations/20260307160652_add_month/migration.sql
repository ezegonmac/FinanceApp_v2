/*
  Warnings:

  - You are about to drop the column `effective_date` on the `Income` table. All the data in the column will be lost.
  - You are about to drop the column `effective_date` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `month_id` to the `Income` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month_id` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Transaction_effective_date_status_idx` ON `Transaction`;

-- AlterTable
ALTER TABLE `Income` DROP COLUMN `effective_date`,
    ADD COLUMN `month_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `effective_date`,
    ADD COLUMN `month_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Month` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transaction_month_id_status_idx` ON `Transaction`(`month_id`, `status`);

-- AddForeignKey
ALTER TABLE `Income` ADD CONSTRAINT `Income_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
