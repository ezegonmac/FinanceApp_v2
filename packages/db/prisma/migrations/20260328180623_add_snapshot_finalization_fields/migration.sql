-- AlterTable
ALTER TABLE `MonthSnapshot` ADD COLUMN `closed_at` DATETIME(3) NULL,
    ADD COLUMN `is_final` BOOLEAN NOT NULL DEFAULT false;
