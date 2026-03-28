-- AlterTable
ALTER TABLE `Income` ADD COLUMN `job_run_id` INTEGER NULL,
    ADD COLUMN `processed_at` DATETIME(3) NULL,
    ADD COLUMN `processing_error` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX `Income_job_run_id_idx` ON `Income`(`job_run_id`);

-- CreateIndex
CREATE INDEX `Income_month_id_status_idx` ON `Income`(`month_id`, `status`);

-- AddForeignKey
ALTER TABLE `Income` ADD CONSTRAINT `Income_job_run_id_fkey` FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
