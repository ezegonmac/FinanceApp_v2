-- CreateTable
CREATE TABLE `MonthBudget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month_id` INTEGER NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonthBudget_month_id_key`(`month_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthBudget` ADD CONSTRAINT `MonthBudget_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
