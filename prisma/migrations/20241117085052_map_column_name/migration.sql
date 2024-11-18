/*
  Warnings:

  - You are about to drop the column `groupId` on the `rule_group` table. All the data in the column will be lost.
  - You are about to drop the column `ruleId` on the `rule_group` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rule_id,group_id]` on the table `rule_group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `group_id` to the `rule_group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rule_id` to the `rule_group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rule_group" DROP CONSTRAINT "rule_group_groupId_fkey";

-- DropForeignKey
ALTER TABLE "rule_group" DROP CONSTRAINT "rule_group_ruleId_fkey";

-- DropIndex
DROP INDEX "rule_group_ruleId_groupId_key";

-- AlterTable
ALTER TABLE "rule_group" DROP COLUMN "groupId",
DROP COLUMN "ruleId",
ADD COLUMN     "group_id" BIGINT NOT NULL,
ADD COLUMN     "rule_id" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rule_group_rule_id_group_id_key" ON "rule_group"("rule_id", "group_id");

-- AddForeignKey
ALTER TABLE "rule_group" ADD CONSTRAINT "rule_group_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_group" ADD CONSTRAINT "rule_group_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
