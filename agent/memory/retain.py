"""
memory/retain.py
================
Builds and stores confirmed incident experiences into Hindsight.

Key design principle:
  Only CONFIRMED operator resolutions are retained — never agent hypotheses.
  This keeps the memory bank clean and trustworthy.

The memory text is written as a rich narrative so Hindsight can extract:
  - Named entities (transaction IDs, incident IDs, merchant IDs)
  - Facts (status values, outcomes)
  - Temporal information (when it happened)
  - Causal relationships (what caused what, what fixed what)
  - Lessons (what to avoid, what to try)
"""
import httpx
from typing import Optional

from memory.hindsight import hindsight, BANK_ID, HINDSIGHT_AVAILABLE


def build_incident_memory(
    transaction: dict,
    gateway: dict,
    webhooks: list[dict],
    diagnosis: str,
    resolution: dict,
) -> str:
    """
    Convert structured evidence + confirmed resolution into a rich
    narrative for Hindsight to process.

    Failed actions are included deliberately — the next agent needs to
    know what was tried and did NOT work, not just what succeeded.
    """
    incident_id = resolution.get("incident_id", "UNKNOWN")
    txn_id = resolution.get("transaction_id", transaction.get("transaction_id", "UNKNOWN"))
    merchant_id = transaction.get("merchant_id", "UNKNOWN")
    amount = transaction.get("amount", "UNKNOWN")
    currency = transaction.get("currency", "INR")
    payment_method = transaction.get("payment_method", "UNKNOWN")
    internal_status = transaction.get("internal_status", "UNKNOWN")
    retry_count = transaction.get("retry_count", 0)

    gateway_status = gateway.get("gateway_status", "UNKNOWN") if gateway else "NOT RETRIEVED"
    gateway_name = gateway.get("gateway_name", "UNKNOWN") if gateway else "NOT RETRIEVED"
    auth_code = gateway.get("authorization_code", "") if gateway else ""

    # Summarise webhook attempts
    if webhooks:
        webhook_summary_parts = []
        for w in webhooks:
            attempt = w.get("attempt_number", "?")
            status = w.get("webhook_status", "?")
            http_status = w.get("http_status", 0)
            error = w.get("error_message", "")
            webhook_summary_parts.append(
                f"Attempt {attempt}: {status}"
                + (f" (HTTP {http_status})" if http_status else "")
                + (f" — {error}" if error else "")
            )
        webhook_summary = "; ".join(webhook_summary_parts)
    else:
        webhook_summary = "No webhook attempts found."

    # Format investigation actions (including failures)
    actions = resolution.get("actions") or []
    if actions:
        action_lines = []
        for i, a in enumerate(actions, start=1):
            action_lines.append(
                f"  Action {i}: [{a.get('result', '?')}] "
                f"{a.get('action_type', '')} — {a.get('action_description', '')}"
            )
        actions_text = "\n".join(action_lines)
    else:
        actions_text = f"  Primary action: {resolution.get('resolution', 'UNKNOWN')}"

    outcome = resolution.get("outcome", "UNKNOWN")
    root_cause = resolution.get("confirmed_root_cause", "UNKNOWN")
    primary_resolution = resolution.get("resolution", "UNKNOWN")
    notes = resolution.get("operator_notes", "")

    # Determine the key pattern for future retrieval
    pattern = f"internal:{internal_status} / gateway:{gateway_status} / webhook:{webhooks[-1].get('webhook_status', 'N/A') if webhooks else 'NONE'}"

    return f"""
Payment incident {incident_id} — Transaction {txn_id}

Merchant: {merchant_id}
Amount: {amount} {currency}
Payment method: {payment_method}
Internal retry count: {retry_count}

SYMPTOM PATTERN: {pattern}

Evidence gathered:
- Internal platform status: {internal_status}
- Gateway ({gateway_name}) status: {gateway_status}
- Gateway authorization code: {auth_code or "none"}
- Webhook attempts: {webhook_summary}

Agent diagnosis:
{diagnosis.strip()}

Investigation actions taken (including failed attempts):
{actions_text}

CONFIRMED root cause (operator-verified):
{root_cause}

Primary resolution:
{primary_resolution}

Outcome: {outcome}

Operator notes:
{notes or "None"}

Key lessons for future incidents with pattern [{pattern}]:
- {"Do NOT allow automatic retry — gateway authorization is live and a duplicate charge is possible." if internal_status == "FAILED" and gateway_status == "AUTHORIZED" else ""}
- Confirmed root cause was: {root_cause}
- The resolution that {("worked" if outcome == "SUCCESS" else "was attempted")} was: {primary_resolution}
{f"- Previous failed actions: {', '.join(a['action_type'] for a in actions if a.get('result') == 'FAILED')}" if any(a.get('result') == 'FAILED' for a in actions) else ""}
""".strip()


async def retain_incident(
    transaction: dict,
    gateway: dict,
    webhooks: list[dict],
    diagnosis: str,
    resolution: dict,
    backend_url: str = "http://localhost:8080",
) -> tuple[bool, str]:
    """
    Store a confirmed resolution into Hindsight AND update PostgreSQL.

    Returns (success: bool, message: str)
    """
    if not HINDSIGHT_AVAILABLE or hindsight is None:
        return False, "Hindsight not available"

    incident_id = resolution.get("incident_id", "UNKNOWN")
    memory_text = build_incident_memory(transaction, gateway, webhooks, diagnosis, resolution)

    # 1. Store in Hindsight
    try:
        await hindsight.aretain(bank_id=BANK_ID, content=memory_text)
    except Exception as exc:
        return False, f"Hindsight retain failed: {exc}"

    # 2. Mark memory_saved = true in PostgreSQL
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.patch(
                f"{backend_url}/api/incidents/{incident_id}/memory-saved"
            )
            resp.raise_for_status()
    except Exception as exc:
        # Non-fatal — Hindsight already has the memory
        pass

    return True, f"Experience from {incident_id} retained in Hindsight bank '{BANK_ID}'"
