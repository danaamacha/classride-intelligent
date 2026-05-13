/*
  Warnings:

  - You are about to drop the column `price_per_trip` on the `owners` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "owners" DROP COLUMN "price_per_trip",
ADD COLUMN     "price_double_trip" DOUBLE PRECISION NOT NULL DEFAULT 500000,
ADD COLUMN     "price_single_trip" DOUBLE PRECISION NOT NULL DEFAULT 300000;
