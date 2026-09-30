"""
scripts/seed_memories.py
========================
Seeds 5 historical payment incidents into the Hindsight payrecall bank.

Run from the agent/ directory:

    python scripts/seed_memories.py

Each incident is a narrative that captures:
  - what happened (symptom pattern)
  - the root cause
  - the resolution steps taken
  - the outcome
  - a key lesson for future investigations

Hindsight processes these into facts, entities, temporal information,
and relationships — not just plain text — so future recall queries can
find relevant incidents even when the wording differs.
"""
import asyncio
import sys
import os

# Ensure agent/ is on path when run from the agent/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from memory.hindsight import hindsight, BANK_ID, HINDSIGHT_AVAILABLE

# ── 5 Historical incidents ────────────────────────────────────────────────────

INCIDENTS: list[str] = [

    # ── INC-001: Classic FAILED/AUTHORIZED/TIMEOUT — the high-risk case ──────
    """
    Incident INC-001. Transaction TXN-0901. Merchant MERCHANT-001.
    Amount: 42,000 INR. Payment method: UPI.

    Symptom pattern:
    The internal payment platform recorded status FAILED.
    The external payment gateway (Stripe) recorded status AUTHORIZED with
    authorization code AUTH-0901.
    Two consecutive webhook delivery attempts both timed out after 30 seconds
    with HTTP status 0 and webhook status TIMEOUT.

    Root cause:
    The gateway authorization completed successfully before any network issue
    occurred. However, the merchant's webhook receiver endpoint was temporarily
    unreachable, which caused both delivery attempts to time out. Because the
    webhook callback never arrived, the internal platform's background job
    marked the transaction as FAILED after the grace period expired.
    The gateway authorization remained live and billable.

    Resolution steps taken:
    1. A payment operations engineer verified the gateway authorization was
       still active in the Stripe dashboard.
    2. The engineer placed a manual hold on further retry attempts to prevent
       duplicate authorization.
    3. The internal transaction record was manually reconciled to match the
       gateway state (set to AUTHORIZED_PENDING_SETTLEMENT).
    4. The merchant was notified. Settlement was monitored for 24 hours.
    5. The gateway authorization settled normally. The transaction closed as
       SETTLED.

    Outcome: SUCCESS.

    Key lesson:
    When internal status is FAILED but gateway status is AUTHORIZED and
    webhook attempts show TIMEOUT, do NOT allow a retry. The gateway
    authorization is live. A retry would create a duplicate authorization
    and risk double-charging the customer. Always verify and reconcile
    the gateway state before any retry decision.
    """,

    # ── INC-002: Normal issuer decline — no mismatch, safe to retry ──────────
    """
    Incident INC-002. Transaction TXN-0902. Merchant MERCHANT-002.
    Amount: 8,500 INR. Payment method: CARD.

    Symptom pattern:
    The internal payment platform recorded status FAILED.
    The payment gateway (Razorpay) recorded status DECLINED with
    response code 05 and message "Do not honor — insufficient funds".
    The merchant webhook delivery succeeded with HTTP 200 within 312ms.
    Webhook status SUCCESS.

    Root cause:
    The card-issuing bank rejected the authorization because the customer's
    account did not have sufficient funds. This is a hard decline from the
    issuer. The gateway correctly reported DECLINED and the webhook notified
    the merchant successfully.

    Resolution steps taken:
    1. Payment operations confirmed the issuer decline code 05.
    2. No gateway authorization exists — the payment was never authorized.
    3. The merchant was advised to prompt the customer to use an alternative
       payment method.
    4. No reconciliation was necessary. Internal and gateway states are
       consistent (both FAILED / DECLINED).

    Outcome: CLOSED. Customer switched to a different card. Payment succeeded
    on the second attempt with a new transaction.

    Key lesson:
    When internal status is FAILED and gateway status is DECLINED and the
    webhook delivered successfully, there is no mismatch. This is a genuine
    issuer decline. Retrying the same card is unlikely to succeed immediately.
    Advise the customer to use an alternative payment method or wait.
    There is no duplicate-payment risk.
    """,

    # ── INC-003: PENDING / AUTHORIZED / webhook HTTP 500 ─────────────────────
    """
    Incident INC-003. Transaction TXN-0903. Merchant MERCHANT-003.
    Amount: 15,750 INR. Payment method: NET_BANKING.

    Symptom pattern:
    The internal payment platform recorded status PENDING.
    The payment gateway (PayU) recorded status AUTHORIZED with
    authorization code AUTH-0903.
    Two webhook delivery attempts both returned HTTP 500 with webhook status
    FAILED and error message "Internal Server Error from merchant endpoint".

    Root cause:
    The gateway authorized the payment. However, the merchant's webhook
    receiver was throwing an unhandled exception on its server, causing HTTP
    500 responses. Because no successful webhook delivery occurred, the
    internal platform kept the transaction in PENDING state instead of
    advancing it to AUTHORIZED or SETTLED.

    Resolution steps taken:
    1. Payment operations identified the HTTP 500 pattern in webhook logs.
    2. The merchant's engineering team was contacted. They identified a
       deployment bug in their webhook handler.
    3. After the merchant fixed the handler, a manual webhook replay was
       triggered.
    4. The webhook delivered successfully (HTTP 200). Internal status
       advanced to SETTLED.

    Outcome: SUCCESS after merchant-side fix and webhook replay.

    Key lesson:
    When internal status is PENDING and gateway status is AUTHORIZED but
    webhook attempts return HTTP 500, the problem is on the merchant's server
    side, not in the payment gateway or internal platform. Do not mark the
    transaction as failed. Contact the merchant's engineering team, request
    a fix, then replay the webhook. The gateway authorization is valid and
    should eventually settle.
    """,

    # ── INC-004: Duplicate authorization caused by premature retry ────────────
    """
    Incident INC-004. Transaction TXN-0904. Merchant MERCHANT-004.
    Amount: 120,000 INR. Payment method: CARD.

    Symptom pattern:
    The internal payment platform recorded status FAILED.
    The payment gateway (Stripe) recorded status AUTHORIZED.
    Webhook delivery timed out.
    A second payment attempt was made before reconciliation of the first.

    Root cause:
    After the first webhook timed out and the internal platform showed FAILED,
    the merchant's system automatically retried the payment using the same
    customer card. The gateway authorized the second payment as well because
    the first authorization had not yet been voided. This resulted in two
    live gateway authorizations for the same customer intent.

    Resolution steps taken:
    1. Payment operations identified both authorizations in the gateway
       dashboard.
    2. The second (duplicate) authorization was immediately voided through
       the gateway.
    3. The first authorization was reconciled with the correct internal
       transaction record.
    4. Settlement proceeded on the first authorization only.
    5. The merchant was advised to implement idempotency checks before
       retrying payments.

    Outcome: SUCCESS after manual void and reconciliation. No customer
    was double-charged, but resolution required significant manual work.

    Key lesson:
    This is the highest-risk scenario. When internal status is FAILED but
    gateway status is AUTHORIZED, never allow an automatic retry before
    verifying the gateway state. Use idempotency keys. A premature retry
    after a webhook timeout can create a second authorization that is
    extremely difficult to unwind — especially for large amounts.
    Always block retries first, verify, then decide.
    """,

    # ── INC-005: Gateway timeout — no authorization at all ───────────────────
    """
    Incident INC-005. Transaction TXN-0905. Merchant MERCHANT-005.
    Amount: 5,200 INR. Payment method: UPI.

    Symptom pattern:
    The internal payment platform recorded status FAILED.
    The payment gateway recorded status TIMEOUT — the gateway itself timed out
    while attempting to communicate with the UPI rails.
    Webhook delivery succeeded with HTTP 200 and status SUCCESS.

    Root cause:
    The UPI network was experiencing intermittent latency. The gateway sent
    the payment instruction but did not receive a response before its own
    timeout threshold. No authorization was created. The gateway reported
    TIMEOUT and the internal platform correctly recorded FAILED.

    Resolution steps taken:
    1. Payment operations confirmed the gateway shows TIMEOUT (not AUTHORIZED
       or DECLINED). This means no money movement occurred.
    2. Because no gateway authorization exists, a retry is safe.
    3. A new payment attempt was created with the same idempotency key.
    4. The retry succeeded on the second attempt once UPI latency resolved.

    Outcome: SUCCESS on retry.

    Key lesson:
    When internal status is FAILED and gateway status is TIMEOUT (not
    AUTHORIZED), there is no duplicate-payment risk. The gateway never
    authorized the payment. Retrying is safe once the gateway-side issue
    resolves. This is fundamentally different from the INC-001 pattern
    where the gateway status was AUTHORIZED. Always distinguish between
    gateway TIMEOUT and gateway AUTHORIZED before deciding on retry.
    """,
]


# ── Seeding logic ─────────────────────────────────────────────────────────────

async def seed() -> None:
    if not HINDSIGHT_AVAILABLE:
        print("[ERROR] hindsight-client not installed. Run: pip install hindsight-client")
        sys.exit(1)

    print(f"\nSeeding {len(INCIDENTS)} historical incidents into Hindsight")
    print(f"  Bank ID  : {BANK_ID}")
    print(f"  Endpoint : {os.getenv('HINDSIGHT_BASE_URL', 'http://localhost:8888')}")
    print()

    for i, incident in enumerate(INCIDENTS, start=1):
        incident_id = f"INC-00{i}"
        print(f"  [{i}/{len(INCIDENTS)}] Retaining {incident_id} ...", end=" ", flush=True)
        try:
            await hindsight.aretain(bank_id=BANK_ID, content=incident.strip())
            print("✓")
        except Exception as exc:
            print(f"✗  ERROR: {exc}")

    print(f"\n✅ Done. {len(INCIDENTS)} incidents retained in bank '{BANK_ID}'.")
    print("\nNext step — verify recall works:")
    print("  python scripts/test_recall.py")


if __name__ == "__main__":
    asyncio.run(seed())
