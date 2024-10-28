CREATE TABLE recipient (
    id  SERIAL PRIMARY KEY,
    app TEXT NOT NULL,
    token   TEXT NOT NULL,
    url     TEXT NOT NULL,
    room    TEXT NOT NULL
);

CREATE TABLE recipient_rule (
    recipient_id INTEGER REFERENCES recipient(id),
    rule_id INTEGER NOT NULL,
    PRIMARY KEY (recipient_id, rule_id)
);