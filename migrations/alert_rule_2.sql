CREATE TABLE rule (
    id  SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    services TEXT[],
)

CREATE TABLE group (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    recipients TEXT[]
)

CREATE TABLE recipient (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     config JSON NOT NULL
)

CREATE TABLE rule_group (
    rule_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL
)

