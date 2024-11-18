/*
  Warnings:

  - You are about to drop the column `group_id` on the `notify_history` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notify_history" DROP CONSTRAINT "notify_history_group_id_fkey";

-- AlterTable
ALTER TABLE "notify_history" DROP COLUMN "group_id";
