/*
  Warnings:

  - Added the required column `enable` to the `alert_rule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "alert_rule" ADD COLUMN     "enable" BOOLEAN NOT NULL;
