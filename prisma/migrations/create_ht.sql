CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('request_count', 'time');

SELECT create_hypertable('response_time', 'time');

SELECT create_hypertable('error', 'time');

SELECT create_hypertable('cpu', 'time');

SELECT create_hypertable('mem', 'time');

SELECT create_hypertable('rx_network', 'time');

SELECT create_hypertable('tx_network', 'time');