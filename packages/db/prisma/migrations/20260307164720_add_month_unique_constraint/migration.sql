/*
  Warnings:

  - A unique constraint covering the columns `[year,month]` on the table `Month` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Month_year_month_key` ON `Month`(`year`, `month`);
