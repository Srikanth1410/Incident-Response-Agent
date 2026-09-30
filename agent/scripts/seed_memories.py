"""
scripts/seed_memories.py
========================
Seeds 18 realistic historical payment incidents into the Hindsight payrecall bank.

Run from the agent/ directory:

    python scripts/seed_memories.py

Each incident is a narrative that captures:
  - what happened (symptom pattern)
  - the root cause
  - the resolution steps taken (including failed attempts where applicable)
  - the outcome
  - a key lesson for future investigations
"""
import asyncio
import sys
import os

# Ensure agent/ is on path when run from the agent/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from memory.hindsight import hindsight, BANK_ID, HINDSIGHT_AVAILABLE

# ── 18 Realistic Historical Incidents ──────────────────────────────────────────

INCIDENTS: list[str] = [
    # ── INC-001: Classic FAILED/AUTHORIZED/TIMEOUT — high risk baseline ───────
    """
    Incident INC-001. Transaction TXN-0901. Merchant MERCHANT-001.
    Amount: 42,000 INR. Payment method: UPI.
    Symptom pattern: FAILED + AUTHORIZED + TIMEOUT.
    Internal status: FAILED. Gateway (Stripe): AUTHORIZED (AUTH-0901).
    Two webhook delivery attempts timed out (HTTP 0, TIMEOUT).
    Root cause: Gateway authorized charge, but merchant webhook receiver was unreachable.
    Internal platform timed out and marked transaction FAILED. Gateway authorization remained live.
    Resolution: Verified Stripe dashboard, blocked retry queue, reconciled internal record to AUTHORIZED.
    Outcome: SUCCESS. Settled normally.
    Key lesson: When internal is FAILED and gateway is AUTHORIZED, never permit retry. Reconcile gateway state first.
    """,

    # ── INC-002: Normal issuer decline ───────────────────────────────────────
    """
    Incident INC-002. Transaction TXN-0902. Merchant MERCHANT-002.
    Amount: 8,500 INR. Payment method: CARD.
    Symptom pattern: FAILED + DECLINED + SUCCESS.
    Internal status: FAILED. Gateway (Razorpay): DECLINED (code 05 - Insufficient funds).
    Webhook delivered successfully (HTTP 200).
    Root cause: Legitimate issuer card decline. No state desync.
    Resolution: Confirmed decline code, advised merchant to prompt customer for alternative payment method.
    Outcome: CLOSED. No duplicate risk.
    Key lesson: Consistent decline across gateway and platform requires no ledger override.
    """,

    # ── INC-003: PENDING with HTTP 500 webhook ────────────────────────────────
    """
    Incident INC-003. Transaction TXN-0903. Merchant MERCHANT-003.
    Amount: 15,750 INR. Payment method: NET_BANKING.
    Symptom pattern: PENDING + AUTHORIZED + HTTP 500.
    Internal status: PENDING. Gateway (PayU): AUTHORIZED (AUTH-0903).
    Webhook attempts returned HTTP 500 (Internal Server Error from merchant endpoint).
    Root cause: Merchant webhook endpoint crashed under burst traffic.
    Resolution: Contacted merchant engineers. Fixed handler crash, triggered manual webhook replay (HTTP 200).
    Outcome: SUCCESS. Advanced to SETTLED.
    Key lesson: Do not void valid gateway authorization on merchant 500 errors; replay webhook after receiver recovers.
    """,

    # ── INC-004: Premature retry duplicate authorization ──────────────────────
    """
    Incident INC-004. Transaction TXN-0904. Merchant MERCHANT-004.
    Amount: 120,000 INR. Payment method: CARD.
    Symptom pattern: FAILED + AUTHORIZED + duplicate retry.
    Internal status: FAILED. Gateway (Stripe): AUTHORIZED.
    Root cause: Automated retry worker triggered before verifying existing gateway authorization, creating double charge.
    Resolution: Voided duplicate authorization immediately, reconciled initial authorization.
    Outcome: SUCCESS after manual void. Prevented double billing.
    Key lesson: Blind retry on FAILED internally + AUTHORIZED externally causes duplicate payments. Always block retry first.
    """,

    # ── INC-005: Gateway timeout without authorization ───────────────────────
    """
    Incident INC-005. Transaction TXN-0905. Merchant MERCHANT-005.
    Amount: 5,200 INR. Payment method: UPI.
    Symptom pattern: FAILED + TIMEOUT + SUCCESS.
    Internal status: FAILED. Gateway status: TIMEOUT. Webhook delivered (HTTP 200).
    Root cause: UPI bank switch timed out before creating authorization. No money moved.
    Resolution: Verified no gateway authorization existed. Triggered safe retry with idempotency key.
    Outcome: SUCCESS on second attempt.
    Key lesson: When gateway status is TIMEOUT (not AUTHORIZED), retry is safe once rails recover.
    """,

    # ── INC-006: Asynchronous gateway webhook drop ───────────────────────────
    """
    Incident INC-006. Transaction TXN-0906. Merchant MERCHANT-006.
    Amount: 28,000 INR. Payment method: NET_BANKING.
    Symptom pattern: PENDING + AUTHORIZED + TIMEOUT.
    Internal status: PENDING. Gateway: AUTHORIZED. Webhook dropped in transit.
    Root cause: Network partition between gateway callback dispatcher and internal ingester.
    Resolution: Ingestion poller queried gateway GET /status API directly, found AUTHORIZED, and reconciled state.
    Outcome: SUCCESS. Order released to shipping.
    Key lesson: Direct gateway status polling resolves silent webhook drops.
    """,

    # ── INC-007: Webhook receiver timeout during flash sale ───────────────────
    """
    Incident INC-007. Transaction TXN-0907. Merchant MERCHANT-007.
    Amount: 9,999 INR. Payment method: UPI.
    Symptom pattern: FAILED + AUTHORIZED + TIMEOUT.
    Root cause: Flash sale load caused merchant database connection pool exhaustion.
    Resolution: Paused retry worker, waited for merchant DB pool scaling, redrove webhook batch.
    Outcome: SUCCESS.
    Key lesson: Distinguish transient infrastructure exhaustion from persistent transaction rejection.
    """,

    # ── INC-008: Idempotency key conflict on parallel checkout ───────────────
    """
    Incident INC-008. Transaction TXN-0908. Merchant MERCHANT-008.
    Amount: 34,500 INR. Payment method: CARD.
    Symptom pattern: AUTHORIZED + duplicate retry + IDEMPOTENCY_CONFLICT.
    Root cause: Customer rapid double-clicked Pay button with same idempotency key.
    Resolution: First authorization respected, second request de-duplicated and returned original auth receipt.
    Outcome: SUCCESS. Single charge confirmed.
    Key lesson: Idempotency keys must be enforced strictly at the gateway boundary.
    """,

    # ── INC-009: Settlement batch delay after gateway maintenance ─────────────
    """
    Incident INC-009. Transaction TXN-0909. Merchant MERCHANT-009.
    Amount: 67,000 INR. Payment method: WIRE.
    Symptom pattern: AUTHORIZED + SETTLEMENT_PENDING.
    Root cause: Bank clearing window delayed by banking holiday.
    Resolution: Verified gateway authorization was irrevocable. Put settlement alert on hold for 24h. Settled cleanly.
    Outcome: SUCCESS.
    Key lesson: Settlement pending does not require transaction reversal if authorization is irrevocable.
    """,

    # ── INC-010: Acquirer batch format rejection ──────────────────────────────
    """
    Incident INC-010. Transaction TXN-0910. Merchant MERCHANT-010.
    Amount: 210,000 INR. Payment method: CORPORATE_CARD.
    Symptom pattern: AUTHORIZED + SETTLEMENT_FAILED.
    Root cause: Mismatched merchant category code (MCC) in batch settlement header.
    Resolution: Updated acquirer batch header formatting and resubmitted settlement file.
    Outcome: SUCCESS on file resubmission.
    Key lesson: Authorization and settlement are decoupled; settlement errors do not invalidate authorization.
    """,

    # ── INC-011: Multi-attempt remediation with failed actions ────────────────
    """
    Incident INC-011. Transaction TXN-0911. Merchant MERCHANT-011.
    Amount: 48,000 INR. Payment method: UPI.
    Symptom pattern: FAILED + AUTHORIZED + TIMEOUT.
    Internal status: FAILED. Gateway status: AUTHORIZED. Webhook: TIMEOUT.
    Remediation attempts:
      Attempt 1: Restart payment ingestion service. Result: FAILED (did not recover missing webhook payload).
      Attempt 2: Automated retry queue fired payment again. Result: FAILED (duplicate authorization error).
      Attempt 3: Manual gateway reconciliation through dashboard. Result: SUCCESS (ledger synchronized).
    Outcome: SUCCESS on Attempt 3 after Attempts 1 & 2 failed.
    Key lesson: Across historical incidents, service restart frequently does not resolve webhook drops. Gateway reconciliation before retry has the highest success rate.
    """,

    # ── INC-012: Double checkout submission without idempotency ──────────────
    """
    Incident INC-012. Transaction TXN-0912. Merchant MERCHANT-012.
    Amount: 18,200 INR. Payment method: CARD.
    Symptom pattern: FAILED + AUTHORIZED + duplicate retry.
    Attempt 1: Cancel transaction. FAILED (gateway charge was already committed).
    Attempt 2: Void gateway authorization. SUCCESS (funds released back to cardholder).
    Outcome: SUCCESS.
    Key lesson: Never mark as canceled without voiding external authorization first.
    """,

    # ── INC-013: Merchant SSL handshake failure ───────────────────────────────
    """
    Incident INC-013. Transaction TXN-0913. Merchant MERCHANT-013.
    Amount: 14,000 INR. Payment method: NET_BANKING.
    Symptom pattern: PENDING + AUTHORIZED + WEBHOOK_SSL_ERROR.
    Root cause: Merchant expired their TLS certificate on their webhook endpoint domain.
    Resolution: Merchant renewed SSL certificate. Triggered manual replay.
    Outcome: SUCCESS.
    Key lesson: SSL failures mean merchant is completely blind to incoming payments; check certificate validity.
    """,

    # ── INC-014: Fraud velocity card decline ──────────────────────────────────
    """
    Incident INC-014. Transaction TXN-0914. Merchant MERCHANT-014.
    Amount: 95,000 INR. Payment method: CARD.
    Symptom pattern: FAILED + DECLINED + SUCCESS.
    Root cause: Card network fraud rule triggered (velocity check exceeded).
    Resolution: Verified genuine decline. Blocked automated retries to prevent cardholder lock.
    Outcome: CLOSED.
    Key lesson: Fraud declines should never be auto-retried.
    """,

    # ── INC-015: Foreign exchange quote expiration ───────────────────────────
    """
    Incident INC-015. Transaction TXN-0915. Merchant MERCHANT-015.
    Amount: 140,000 INR (approx $1,680 USD). Payment method: INT_CARD.
    Symptom pattern: FAILED + AUTHORIZED + FX_MISMATCH.
    Root cause: 15-minute FX lock expired during 3D-Secure authentication.
    Resolution: Reconciled transaction with updated FX rate from processor.
    Outcome: SUCCESS.
    Key lesson: Cross-border payments require FX settlement validation.
    """,

    # ── INC-016: Webhook HMAC signature mismatch ──────────────────────────────
    """
    Incident INC-016. Transaction TXN-0916. Merchant MERCHANT-016.
    Amount: 31,000 INR. Payment method: UPI.
    Symptom pattern: PENDING + AUTHORIZED + HTTP 401.
    Root cause: Merchant rotated webhook secret key without updating secondary verification secret.
    Resolution: Merchant reconfigured signing secret. Webhook replayed and accepted.
    Outcome: SUCCESS.
    Key lesson: HTTP 401 on webhooks indicates signature mismatch rather than transaction failure.
    """,

    # ── INC-017: Bank rail temporary 503 maintenance ─────────────────────────
    """
    Incident INC-017. Transaction TXN-0917. Merchant MERCHANT-017.
    Amount: 7,500 INR. Payment method: UPI.
    Symptom pattern: FAILED + GATEWAY_503 + TIMEOUT.
    Root cause: Scheduled NPCI core banking maintenance window. No authorization created.
    Resolution: Verified zero authorization on gateway. Safe retry triggered after maintenance window.
    Outcome: SUCCESS.
    Key lesson: Gateway 503 with zero authorization is safe to retry.
    """,

    # ── INC-018: Multi-attempt database lock failure ──────────────────────────
    """
    Incident INC-018. Transaction TXN-0918. Merchant MERCHANT-018.
    Amount: 62,000 INR. Payment method: CARD.
    Symptom pattern: FAILED + AUTHORIZED + TIMEOUT.
    Remediation attempts:
      Attempt 1: Blind database state update without gateway verification. FAILED (concurrency lock conflict).
      Attempt 2: Gateway API reconciliation call followed by row lock. SUCCESS.
    Outcome: SUCCESS.
    Key lesson: Always verify external gateway state before updating internal ledger records.
    """,
]

async def seed() -> None:
    if not HINDSIGHT_AVAILABLE:
        print("[ERROR] hindsight-client not installed. Run: pip install hindsight-client")
        sys.exit(1)

    print(f"\nSeeding {len(INCIDENTS)} realistic historical incidents into Hindsight")
    print(f"  Bank ID  : {BANK_ID}")
    print(f"  Endpoint : {os.getenv('HINDSIGHT_BASE_URL', 'http://localhost:8888')}")
    print()

    for i, incident in enumerate(INCIDENTS, start=1):
        incident_id = f"INC-{i:03d}"
        print(f"  [{i}/{len(INCIDENTS)}] Retaining {incident_id} ...", end=" ", flush=True)
        try:
            await hindsight.aretain(bank_id=BANK_ID, content=incident.strip())
            print("✓")
        except Exception as exc:
            print(f"✗  ERROR: {exc}")

    print(f"\n✅ Done. {len(INCIDENTS)} incidents retained in bank '{BANK_ID}'.")


if __name__ == "__main__":
    asyncio.run(seed())
