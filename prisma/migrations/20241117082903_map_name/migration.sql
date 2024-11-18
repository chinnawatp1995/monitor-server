/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recipient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RuleGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RuleGroup" DROP CONSTRAINT "RuleGroup_groupId_fkey";

-- DropForeignKey
ALTER TABLE "RuleGroup" DROP CONSTRAINT "RuleGroup_ruleId_fkey";

-- DropTable
DROP TABLE "Group";

-- DropTable
DROP TABLE "Recipient";

-- DropTable
DROP TABLE "RuleGroup";

-- CreateTable
CREATE TABLE "recipient" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "recipients" TEXT[],

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_group" (
    "ruleId" BIGINT NOT NULL,
    "groupId" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "rule_group_ruleId_groupId_key" ON "rule_group"("ruleId", "groupId");

-- AddForeignKey
ALTER TABLE "rule_group" ADD CONSTRAINT "rule_group_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_group" ADD CONSTRAINT "rule_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
