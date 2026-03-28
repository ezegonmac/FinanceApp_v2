-- AlterTable
ALTER TABLE `Transaction`
    ADD COLUMN `job_run_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Transaction_job_run_id_idx` ON `Transaction`(`job_run_id`);

-- AddForeignKey
ALTER TABLE `Transaction`
    ADD CONSTRAINT `Transaction_job_run_id_fkey`
    FOREIGN KEY (`job_run_id`) REFERENCES `JobRun`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
