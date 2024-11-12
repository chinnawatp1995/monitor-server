-- CreateTable
CREATE TABLE "request_count" (
    "time" TIMESTAMPTZ(6) NOT NULL,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "value" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "response_time" (
    "time" TIMESTAMPTZ(6) NOT NULL,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
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
    "time" TIMESTAMPTZ(6) NOT NULL,
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
    "time" TIMESTAMPTZ(6) NOT NULL,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL
);

-- CreateTable
CREATE TABLE "mem" (
    "time" TIMESTAMPTZ(6) NOT NULL,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL
);

-- CreateTable
CREATE TABLE "rx_network" (
    "time" TIMESTAMPTZ(6) NOT NULL,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "tx_network" (
    "time" TIMESTAMPTZ(6) NOT NULL,
    "service" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "value" BIGINT NOT NULL
);

-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- SELECT create_hypertable('request_count', 'time');

-- SELECT create_hypertable('response_time', 'time');

-- SELECT create_hypertable('error', 'time');

-- SELECT create_hypertable('cpu', 'time')

-- SELECT create_hypertable('mem', 'time')

-- SELECT create_hypertable('rx_network', 'time')

-- SELECT create_hypertable('tx_network', 'time')