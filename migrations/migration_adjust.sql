-- CREATE TABLE instance (
--     instance_id 
--     job         TEXT NOT NULL,
--     machine  TEXT NOT NULL,
-- )

--  Old Schema 

CREATE TABLE  request (
    id              SERIAL, 
    time            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    service         TEXT NOT NULL,
    controller      TEXT NOT NULL DEFAULT '',
    machine_id      TEXT NOT NULL,
    method          TEXT NOT NULL,
    path            TEXT NOT NULL,
    status_code     INTEGER NOT NULL,
    response_time   DOUBLE PRECISION NOT NULL,
    error_message   TEXT,
    -- client_ip       TEXT,
    -- user_agent      TEXT,
    -- trace_id        TEXT
)

SELECT create_hypertable('request', 'time')

CREATE INDEX idx_req_instance_time ON request (service, machine_id, time);
CREATE INDEX idx_req_instance ON request (service, machine_id);
CREATE INDEX idx_req_path ON request_rate (path);

CREATE TABLE cpu_usage (
    id          SERIAL,
    time        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    service     TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL
)

SELECT create_hypertable('cpu_usage', 'time');

CREATE INDEX idx_cpu_instance_time ON cpu_usage (service, machine_id, time);
CREATE INDEX idx_cpu_instance ON cpu_usage (service, machine_id);

CREATE TABLE mem_usage (
    id          SERIAL,
    time        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    service     TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL
)

SELECT create_hypertable('mem_usage', 'time');

CREATE INDEX idx_mem_instance_time ON mem_usage (service, machine_id, time);
CREATE INDEX idx_mem_instance ON mem_usage (service, machine_id);

CREATE TABLE network_usage (
    id          SERIAL,
    time        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    service     TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    interface   TEXT,
    rx_sec      BIGINT NOT NULL,
    tx_sec      BIGINT NOT NULL
)

SELECT create_hypertable('network_usage', 'time');

CREATE INDEX idx_network_instance_time ON network_usage (service, machine_id, time);
CREATE INDEX idx_network_instance ON network_usage (service, machine_id);

CREATE TABLE server_status (
    time        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    machine_id TEXT NOT NULL,
    service    TEXT NOT NULL,
    status     BOOLEAN NOT NULL
)

SELECT create_hypertable('server_status', 'time');

CREATE INDEX idx_server_status ON server_status(machine_id)
CREATE INDEX idx_server_status ON server_status(status)