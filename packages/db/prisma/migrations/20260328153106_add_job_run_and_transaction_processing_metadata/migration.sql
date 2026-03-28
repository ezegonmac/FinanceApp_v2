-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `processed_at` DATETIME(3) NULL,
    ADD COLUMN `processing_error` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `JobRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_name` VARCHAR(191) NOT NULL,
    `madrid_date` VARCHAR(10) NOT NULL,
    `status` ENUM('RUNNING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'RUNNING',
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finished_at` DATETIME(3) NULL,
    `processed_count` INTEGER NOT NULL DEFAULT 0,
    `failed_count` INTEGER NOT NULL DEFAULT 0,
    `skipped_count` INTEGER NOT NULL DEFAULT 0,
    `error_message` VARCHAR(191) NULL,

    UNIQUE INDEX `JobRun_job_name_madrid_date_key`(`job_name`, `madrid_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
