-- AlterTable
ALTER TABLE "cpu" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "error" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "mem" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "request_count" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "response_time" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "rx_network" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tx_network" ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "server_status" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "machine_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "server_status_time_service_machine_id_key" ON "server_status"("time", "service", "machine_id");
