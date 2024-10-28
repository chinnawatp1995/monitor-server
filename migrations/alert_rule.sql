CREATE TABLE alert_rule (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    service         TEXT,
    machine_id      TEXT,
    metric_type     TEXT NOT NULL,  -- 'cpu', 'memory', 'request_rate', 'error_rate', 'response_time'
    aggregation     TEXT NOT NULL,  -- 'avg', 'count', 'sum', 'min', 'max', 'none'
    condition       TEXT NOT NULL,  -- '>', '<', '>=', '<='
    threshold       DOUBLE PRECISION NOT NULL,
    duration        INTEGER NOT NULL,  -- How long condition must be true before alerting
    severity        TEXT NOT NULL,  -- 'critical', 'warning', 'info'
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_rule_service ON alert_rule(service);
CREATE INDEX idx_alert_rule_machine ON alert_rule(machine_id);

CREATE TABLE alert_history (
    id              SERIAL PRIMARY KEY,
    rule_id         INTEGER REFERENCES alert_rule(id),
    service         TEXT NOT NULL,
    machine_id      TEXT,
    metric_type     TEXT NOT NULL,
    metric_value    DOUBLE PRECISION NOT NULL,
    triggered_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMP WITH TIME ZONE,
    status          TEXT NOT NULL  -- 'triggered', 'resolved'
);

SELECT create_hypertable('alert_history', 'triggered_at');

CREATE INDEX idx_alert_history_rule ON alert_history(rule_id);
CREATE INDEX idx_alert_history_service ON alert_history(service);
CREATE INDEX idx_alert_history_machine ON alert_history(machine_id);