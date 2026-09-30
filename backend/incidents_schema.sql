-- ============================================================
-- PayRecall — Incidents & Investigation Actions Schema
-- Appended to seed.sql / run once on your database
-- ============================================================

-- ── incidents ─────────────────────────────────────────────────────────────────
-- The official structured record for every investigated transaction.
-- PostgreSQL = truth; Hindsight = learned experience.
CREATE TABLE IF NOT EXISTS incidents (
    incident_id       TEXT        PRIMARY KEY,   -- e.g. INC-101
    transaction_id    TEXT        NOT NULL REFERENCES transactions(transaction_id),
    agent_diagnosis   TEXT        NOT NULL DEFAULT '',
    agent_risk_level  TEXT        NOT NULL DEFAULT '',
    recommendation    TEXT        NOT NULL DEFAULT '',
    confirmed_root_cause TEXT     NOT NULL DEFAULT '',
    resolution        TEXT        NOT NULL DEFAULT '',
    outcome           TEXT        NOT NULL DEFAULT '',   -- SUCCESS | FAILED | OPEN
    operator_notes    TEXT        NOT NULL DEFAULT '',
    memory_saved      BOOLEAN     NOT NULL DEFAULT FALSE,
    opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at       TIMESTAMPTZ
);

-- ── investigation_actions ─────────────────────────────────────────────────────
-- Tracks every action tried — including failed ones.
-- "Restarting the service FAILED; reconciling the gateway SUCCEEDED."
CREATE TABLE IF NOT EXISTS investigation_actions (
    action_id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id       TEXT        NOT NULL REFERENCES incidents(incident_id),
    action_order      INTEGER     NOT NULL,
    action_type       TEXT        NOT NULL,   -- RESTART_SERVICE, RECONCILE_PAYMENT, etc.
    action_description TEXT       NOT NULL,
    result            TEXT        NOT NULL,   -- SUCCESS | FAILED | PENDING
    actioned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
