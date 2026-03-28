-- CreateTable
CREATE TABLE `MonthSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month_id` INTEGER NOT NULL,
    `account_id` INTEGER NOT NULL,
    `total_incomes` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total_transactions_in` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total_transactions_out` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `MonthSnapshot_account_id_idx`(`account_id`),
    UNIQUE INDEX `MonthSnapshot_month_id_account_id_key`(`month_id`, `account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthSnapshot` ADD CONSTRAINT `MonthSnapshot_month_id_fkey` FOREIGN KEY (`month_id`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthSnapshot` ADD CONSTRAINT `MonthSnapshot_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
