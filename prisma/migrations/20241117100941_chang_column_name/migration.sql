/*
  Warnings:

  - You are about to drop the `group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rule_group" DROP CONSTRAINT "rule_group_group_id_fkey";

-- DropTable
DROP TABLE "group";

-- CreateTable
CREATE TABLE "recipient_group" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "recipients" TEXT[],

    CONSTRAINT "recipient_group_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rule_group" ADD CONSTRAINT "rule_group_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "recipient_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
