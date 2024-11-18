-- AlterTable
ALTER TABLE "alert_rule" ADD COLUMN     "duration" TEXT NOT NULL DEFAULT '5 minutes',
ADD COLUMN     "silence_time" TEXT NOT NULL DEFAULT '30 minutes';
