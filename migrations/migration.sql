-- CREATE TABLE instance (
--     instance_id 
--     job         TEXT NOT NULL,
--     machine  TEXT NOT NULL,
-- )

CREATE TABLE request_rate (
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    job         TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    count       INTEGER NOT NULL,
    path        TEXT NOT NULL
    UNIQUE ( job, machine_id, path, created )
);

SELECT create_hypertable('request_rate', 'created');

CREATE INDEX idx_req_instance_time ON request_rate (job, machine_id, created);
CREATE INDEX idx_req_instance ON request_rate (job, machine_id);
CREATE INDEX idx_req_path ON request_rate (path);

CREATE TABLE response_duration (
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    job         TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    lower_bound INTEGER NOT NULL,  -- latency lower bound of bucket
    upper_bound INTEGER NOT NULL,   -- latency upper bound of bucket
    status_code TEXT NOT NULL,
    path        TEXT NOT NULL,
    count       INTEGER NOT NULL
    UNIQUE ( job, machine_id, path, lower_bound, upper_bound, status_code, created )
);

SELECT create_hypertable('response_duration', 'created');

CREATE INDEX idx_res_instance_time ON response_duration (job, machine_id, created);
CREATE INDEX idx_res_instance ON response_duration (job, machine_id, status_code);
CREATE INDEX idx_res_path ON response_duration (path);

CREATE TABLE error_rate (
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    job         TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    error_code  INTEGER NOT NULL,
    path        TEXT NOT NULL
    UNIQUE ( job, machine_id, path, error_code, created )
);

SELECT create_hypertable('error_rate', 'created');

CREATE INDEX idx_error_instance_time ON error_rate (job, machine_id, created);
CREATE INDEX idx_error_instance ON error_rate (job, machine_id);
CREATE INDEX idx_error_code ON error_rate (error_code);
CREATE INDEX idx_error_path ON error_rate (path);

CREATE TABLE cpu_usage (
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    job         TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL
    UNIQUE ( job, machine_id, created )
);

SELECT create_hypertable('cpu_usage', 'created');

CREATE INDEX idx_cpu_instance_time ON error_rate (job, machine_id, created);
CREATE INDEX idx_cpu_instance ON cpu_usage (job, machine_id);

CREATE TABLE mem_usage (
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    job         TEXT NOT NULL,
    machine_id  TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL   
    UNIQUE ( job, machine_id, created )
) ;

SELECT create_hypertable('mem_usage', 'created');

CREATE INDEX idx_mem_instance_time ON error_rate (job, machine_id, created);
CREATE INDEX idx_mem_instance ON mem_usage (job, machine_id);