-- CreateTable
CREATE TABLE "request_count" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "value" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "response_time" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "count" BIGINT NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "bucket_25" BIGINT NOT NULL DEFAULT 0,
    "bucket_50" BIGINT NOT NULL DEFAULT 0,
    "bucket_100" BIGINT NOT NULL DEFAULT 0,
    "bucket_200" BIGINT NOT NULL DEFAULT 0,
    "bucket_400" BIGINT NOT NULL DEFAULT 0,
    "bucket_800" BIGINT NOT NULL DEFAULT 0,
    "bucket_1600" BIGINT NOT NULL DEFAULT 0,
    "bucket_3200" BIGINT NOT NULL DEFAULT 0,
    "bucket_6400" BIGINT NOT NULL DEFAULT 0,
    "bucket_12800" BIGINT NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "error" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "error_code" TEXT,
    "error_title" TEXT,
    "value" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "cpu" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL
);

-- CreateTable
CREATE TABLE "mem" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL
);

-- CreateTable
CREATE TABLE "rx_network" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "tx_network" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "server_status" (
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "machine_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "request_count_time_service_machine_controller_path_status_c_key" ON "request_count"("time", "service", "machine", "controller", "path", "status_code");

-- CreateIndex
CREATE UNIQUE INDEX "response_time_time_service_machine_controller_path_status_c_key" ON "response_time"("time", "service", "machine", "controller", "path", "status_code");

-- CreateIndex
CREATE UNIQUE INDEX "error_time_service_machine_controller_path_key" ON "error"("time", "service", "machine", "controller", "path");

-- CreateIndex
CREATE UNIQUE INDEX "cpu_time_service_machine_key" ON "cpu"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "mem_time_service_machine_key" ON "mem"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "rx_network_time_service_machine_key" ON "rx_network"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "tx_network_time_service_machine_key" ON "tx_network"("time", "service", "machine");

-- CreateIndex
CREATE UNIQUE INDEX "server_status_time_service_machine_id_key" ON "server_status"("time", "service", "machine_id");

CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('request_count', 'time');

SELECT create_hypertable('response_time', 'time');

SELECT create_hypertable('error', 'time');

SELECT create_hypertable('cpu', 'time');

SELECT create_hypertable('mem', 'time');

SELECT create_hypertable('rx_network', 'time');

SELECT create_hypertable('tx_network', 'time');