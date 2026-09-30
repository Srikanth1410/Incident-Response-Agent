-- ============================================================
-- PayRecall — Database Schema + Seed Data
-- Three test scenarios for the agent milestone
-- ============================================================

-- ── Schema ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id  TEXT PRIMARY KEY,
    merchant_id     TEXT        NOT NULL,
    amount          NUMERIC     NOT NULL,
    currency        TEXT        NOT NULL DEFAULT 'INR',
    payment_method  TEXT        NOT NULL,
    internal_status TEXT        NOT NULL,
    retry_count     INTEGER     NOT NULL DEFAULT 0,
    idempotency_key TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gateway_transactions (
    gateway_transaction_id  TEXT PRIMARY KEY,
    transaction_id          TEXT        NOT NULL REFERENCES transactions(transaction_id),
    gateway_name            TEXT        NOT NULL,
    gateway_status          TEXT        NOT NULL,
    gateway_response_code   TEXT        NOT NULL,
    gateway_response_message TEXT       NOT NULL,
    authorization_code      TEXT        NOT NULL DEFAULT '',
    processed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_attempts (
    webhook_attempt_id TEXT PRIMARY KEY,
    transaction_id     TEXT        NOT NULL REFERENCES transactions(transaction_id),
    merchant_id        TEXT        NOT NULL,
    attempt_number     INTEGER     NOT NULL,
    http_status        INTEGER     NOT NULL DEFAULT 0,
    webhook_status     TEXT        NOT NULL,
    response_time_ms   INTEGER     NOT NULL DEFAULT 0,
    error_message      TEXT        NOT NULL DEFAULT '',
    attempted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed: clear existing test rows ───────────────────────────
DELETE FROM webhook_attempts     WHERE transaction_id IN ('TXN-1001','TXN-1002','TXN-1003','TXN-DEMO-001','TXN-DEMO-002','TXN-DEMO-003');
DELETE FROM gateway_transactions WHERE transaction_id IN ('TXN-1001','TXN-1002','TXN-1003','TXN-DEMO-001','TXN-DEMO-002','TXN-DEMO-003');
DELETE FROM transactions         WHERE transaction_id IN ('TXN-1001','TXN-1002','TXN-1003','TXN-DEMO-001','TXN-DEMO-002','TXN-DEMO-003');

-- ────────────────────────────────────────────────────────────
-- Demo A — TXN-DEMO-001 (BASELINE INCIDENT - BEFORE LEARNING)
-- Internal: FAILED | Gateway: AUTHORIZED | Webhook: TIMEOUT | Retry: 0
-- Expected agent output: Cautious generic recommendation (no prior exact memory)
-- ────────────────────────────────────────────────────────────
INSERT INTO transactions VALUES (
    'TXN-DEMO-001', 'MERCHANT-DEMO-A', 54000.00, 'INR', 'UPI',
    'FAILED', 0, 'IK-DEMO-001',
    NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'
);

INSERT INTO gateway_transactions VALUES (
    'GW-TXN-DEMO-001', 'TXN-DEMO-001', 'Stripe', 'AUTHORIZED',
    '00', 'Payment authorized successfully', 'AUTH-DEMO-99120',
    NOW() - INTERVAL '4 hours'
);

INSERT INTO webhook_attempts VALUES
    ('WH-DEMO-001-1', 'TXN-DEMO-001', 'MERCHANT-DEMO-A', 1, 0, 'TIMEOUT', 30000, 'Connection timed out after 30s', NOW() - INTERVAL '4 hours');

-- ────────────────────────────────────────────────────────────
-- Demo B — TXN-DEMO-002 (SIMILAR INCIDENT - AFTER LEARNING)
-- Internal: FAILED | Gateway: AUTHORIZED | Webhook: TIMEOUT | Retry: 1
-- Expected agent output: Specific recommendation backed by newly learned memory INC-DEMO-001
-- ────────────────────────────────────────────────────────────
INSERT INTO transactions VALUES (
    'TXN-DEMO-002', 'MERCHANT-DEMO-B', 54000.00, 'INR', 'UPI',
    'FAILED', 1, 'IK-DEMO-002',
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '20 minutes'
);

INSERT INTO gateway_transactions VALUES (
    'GW-TXN-DEMO-002', 'TXN-DEMO-002', 'Stripe', 'AUTHORIZED',
    '00', 'Payment authorized successfully', 'AUTH-DEMO-77192',
    NOW() - INTERVAL '30 minutes'
);

INSERT INTO webhook_attempts VALUES
    ('WH-DEMO-002-1', 'TXN-DEMO-002', 'MERCHANT-DEMO-B', 1, 0, 'TIMEOUT', 30000, 'Connection timed out after 30s', NOW() - INTERVAL '30 minutes');

-- ────────────────────────────────────────────────────────────
-- Demo C — TXN-DEMO-003 (PROVE NO BLIND REUSE - ACTUALLY DECLINED)
-- Internal: FAILED | Gateway: DECLINED | Webhook: SUCCESS | Retry: 0
-- Expected agent output: Issuer decline, low duplicate risk, do NOT reconcile
-- ────────────────────────────────────────────────────────────
INSERT INTO transactions VALUES (
    'TXN-DEMO-003', 'MERCHANT-DEMO-C', 12500.00, 'INR', 'CARD',
    'FAILED', 0, 'IK-DEMO-003',
    NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'
);

INSERT INTO gateway_transactions VALUES (
    'GW-TXN-DEMO-003', 'TXN-DEMO-003', 'Razorpay', 'DECLINED',
    '05', 'Do not honor — insufficient funds', '',
    NOW() - INTERVAL '15 minutes'
);

INSERT INTO webhook_attempts VALUES
    ('WH-DEMO-003-1', 'TXN-DEMO-003', 'MERCHANT-DEMO-C', 1, 200, 'SUCCESS', 280, '', NOW() - INTERVAL '15 minutes');

-- ────────────────────────────────────────────────────────────
-- Case A — TXN-1001 (DANGEROUS MISMATCH)
-- Internal: FAILED  | Gateway: AUTHORIZED | Webhook: TIMEOUT×2
-- Expected agent output: HIGH duplicate-payment risk
-- ────────────────────────────────────────────────────────────
INSERT INTO transactions VALUES (
    'TXN-1001', 'MERCHANT-001', 42000.00, 'INR', 'UPI',
    'FAILED', 2, 'IK-1001-A',
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours'
);

INSERT INTO gateway_transactions VALUES (
    'GW-TXN-1001', 'TXN-1001', 'Stripe', 'AUTHORIZED',
    '00', 'Payment authorized successfully', 'AUTH-XK9912',
    NOW() - INTERVAL '3 hours'
);

INSERT INTO webhook_attempts VALUES
    ('WH-1001-1', 'TXN-1001', 'MERCHANT-001', 1, 0,   'TIMEOUT', 30000, 'Connection timed out after 30s', NOW() - INTERVAL '3 hours'),
    ('WH-1001-2', 'TXN-1001', 'MERCHANT-001', 2, 0,   'TIMEOUT', 30000, 'Connection timed out after 30s', NOW() - INTERVAL '2 hours 45 minutes');

-- ────────────────────────────────────────────────────────────
-- Case B — TXN-1002 (NORMAL DECLINE)
-- Internal: FAILED  | Gateway: DECLINED  | Webhook: SUCCESS
-- Expected agent output: genuine issuer decline, no mismatch
-- ────────────────────────────────────────────────────────────
INSERT INTO transactions VALUES (
    'TXN-1002', 'MERCHANT-002', 8500.00, 'INR', 'CARD',
    'FAILED', 0, 'IK-1002-B',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
);

INSERT INTO gateway_transactions VALUES (
    'GW-TXN-1002', 'TXN-1002', 'Razorpay', 'DECLINED',
    '05', 'Do not honor — insufficient funds', '',
    NOW() - INTERVAL '6 hours'
);

INSERT INTO webhook_attempts VALUES
    ('WH-1002-1', 'TXN-1002', 'MERCHANT-002', 1, 200, 'SUCCESS', 312, '', NOW() - INTERVAL '6 hours');

-- ────────────────────────────────────────────────────────────
-- Case C — TXN-1003 (PENDING WEBHOOK PROBLEM)
-- Internal: PENDING | Gateway: AUTHORIZED | Webhook: FAILED(500)
-- Expected agent output: async state-update issue, investigate webhook processing
-- ────────────────────────────────────────────────────────────
INSERT INTO transactions VALUES (
    'TXN-1003', 'MERCHANT-003', 15750.00, 'INR', 'NET_BANKING',
    'PENDING', 0, 'IK-1003-C',
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
);

INSERT INTO gateway_transactions VALUES (
    'GW-TXN-1003', 'TXN-1003', 'PayU', 'AUTHORIZED',
    '00', 'Authorized', 'AUTH-PU88231',
    NOW() - INTERVAL '1 hour'
);

INSERT INTO webhook_attempts VALUES
    ('WH-1003-1', 'TXN-1003', 'MERCHANT-003', 1, 500, 'FAILED', 4821, 'Internal Server Error from merchant endpoint', NOW() - INTERVAL '55 minutes'),
    ('WH-1003-2', 'TXN-1003', 'MERCHANT-003', 2, 500, 'FAILED', 3201, 'Internal Server Error from merchant endpoint', NOW() - INTERVAL '40 minutes');

-- ────────────────────────────────────────────────────────────
-- Case D — TXN-9999 (INVALID / NOT FOUND)
-- Used to test agent error handling
-- (intentionally not inserted — let the agent report "not found")
-- ────────────────────────────────────────────────────────────
