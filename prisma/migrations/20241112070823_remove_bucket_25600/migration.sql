/*
  Warnings:

  - You are about to drop the column `bucket_25600` on the `response_time` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "response_time" DROP COLUMN "bucket_25600";
