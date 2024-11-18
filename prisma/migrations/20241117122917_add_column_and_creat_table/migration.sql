-- AlterTable
ALTER TABLE "alert_rule" ADD COLUMN     "message" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "threshold" DROP NOT NULL;

-- CreateTable
CREATE TABLE "notify_history" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_id" BIGINT NOT NULL,
    "group_id" BIGINT NOT NULL,
    "detail" TEXT,

    CONSTRAINT "notify_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notify_history" ADD CONSTRAINT "notify_history_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notify_history" ADD CONSTRAINT "notify_history_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "recipient_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
