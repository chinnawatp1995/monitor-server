/*
  Warnings:

  - A unique constraint covering the columns `[time,service,machine]` on the table `cpu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[time,service,machine,controller,path]` on the table `error` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[time,service,machine]` on the table `mem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[time,service,machine,controller,path,statusCode]` on the table `request_count` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[time,service,machine,controller,path,statusCode]` on the table `response_time` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[time,service,machine]` on the table `rx_network` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[time,service,machine]` on the table `tx_network` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "response_time" ADD COLUMN     "bucket_25600" BIGINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "cpu_time_service_machine_key" ON "cpu"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "error_time_service_machine_controller_path_key" ON "error"("time", "service", "machine", "controller", "path");

-- CreateIndex
CREATE UNIQUE INDEX "mem_time_service_machine_key" ON "mem"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "request_count_time_service_machine_controller_path_statusCo_key" ON "request_count"("time", "service", "machine", "controller", "path", "statusCode");

-- CreateIndex
CREATE UNIQUE INDEX "response_time_time_service_machine_controller_path_statusCo_key" ON "response_time"("time", "service", "machine", "controller", "path", "statusCode");

-- CreateIndex
CREATE UNIQUE INDEX "rx_network_time_service_machine_key" ON "rx_network"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "tx_network_time_service_machine_key" ON "tx_network"("time", "service", "machine");
