CREATE TABLE recipient (
    id  SERIAL PRIMARY KEY,
    app TEXT NOT NULL,
    token   TEXT NOT NULL,
    url     TEXT NOT NULL,
    room    TEXT NOT NULL
);

CREATE TABLE alert_recipient (
    recipient_id INTEGER REFERENCES recipient(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES alert_rule(id) ON DELETE CASCADE,
    PRIMARY KEY (recipient_id, rule_id)
);