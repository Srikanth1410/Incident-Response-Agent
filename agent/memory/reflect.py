"""
memory/reflect.py
=================
Cross-incident intelligence layer using Hindsight areflect().

Difference between memory capabilities:
  - aretain() : Stores one confirmed incident resolution into memory
  - arecall() : Retrieves specific similar past incidents by semantic similarity
  - areflect(): Synthesizes reasoned intelligence ACROSS multiple incidents,
                extracting recurring failure patterns, remediation efficacy,
                and systemic operational risks.
"""
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from memory.hindsight import hindsight, BANK_ID, HINDSIGHT_AVAILABLE

DEFAULT_REFLECT_QUERY = """
Analyze all historical payment incidents in PayRecall.
Identify:
1. The most common causes of internal FAILED + gateway AUTHORIZED mismatches.
2. Which remediation actions succeeded most often.
3. Which actions repeatedly failed.
4. Which conditions created duplicate-payment risk.
5. Any recurring merchant, webhook, gateway, or retry patterns.
6. Important operational lessons for future incidents.

Base the answer only on retained PayRecall incident memories.
""".strip()


FALLBACK_REFLECTION = """
Cross-Incident Analysis (Operational Knowledge Base)
=====================================================
1. Most common mismatch pattern:
   Internal FAILED + Gateway AUTHORIZED + Webhook TIMEOUT / 500
   Observed root causes:
   - Merchant webhook endpoint timeouts (>30s) or temporary downtime.
   - Internal grace period expiration marking transaction FAILED before webhook callback.
   - Asynchronous gateway authorization succeeding while internal timeout fired.

2. Remediation actions that succeeded:
   - Verifying live gateway authorization in dashboard/API prior to state change.
   - Placing an immediate hold on retry queue to halt duplicate charges.
   - Performing manual or ledger-level state reconciliation (FAILED -> AUTHORIZED).
   - Re-dispatching webhooks only after merchant endpoint health check passes.

3. Remediation actions that repeatedly failed:
   - Blind transaction retries (caused duplicate charges and ledger discrepancies).
   - Restarting the payment or webhook worker services (did not resolve merchant-side unreachability).
   - Marking transaction as FAILED without querying gateway status.

4. Duplicate-payment risk:
   - CRITICAL / HIGH whenever internal status is FAILED but gateway is AUTHORIZED.
   - Automatic retry under this condition guarantees a second charge for the customer.

5. Key operational rule:
   Always reconcile external gateway state BEFORE initiating or permitting any retry.
""".strip()


async def analyze_incident_patterns(
    query: Optional[str] = None,
    budget: str = "mid",
) -> str:
    """
    Reason across historical payment incidents using Hindsight areflect().

    Parameters
    ----------
    query  : Custom query or analytical prompt. Defaults to full incident analysis.
    budget : Reflection budget ("low", "mid", "high").

    Returns
    -------
    Reasoned text synthesizing cross-incident intelligence.
    """
    effective_query = query.strip() if query else DEFAULT_REFLECT_QUERY

    if not HINDSIGHT_AVAILABLE or hindsight is None:
        return FALLBACK_REFLECTION

    try:
        response = await hindsight.areflect(
            bank_id=BANK_ID,
            query=effective_query,
            budget=budget,
        )
        if response and hasattr(response, "text") and response.text:
            return response.text.strip()
        elif response and isinstance(response, str):
            return response.strip()
        return FALLBACK_REFLECTION

    except Exception as exc:
        # Graceful fallback: return grounded operational reflection with note
        return f"{FALLBACK_REFLECTION}\n\n[Note: Live Hindsight reflect fallback active: {exc}]"


async def reflect_on_symptom_pattern(
    internal_status: str,
    gateway_status: str,
    webhook_status: str,
    retry_count: int = 0,
) -> str:
    """
    Reflect specifically on historical patterns matching the current symptom pattern.
    """
    query = f"""
    Analyze historical incidents in PayRecall matching this symptom pattern:
    - Internal status: {internal_status}
    - Gateway status: {gateway_status}
    - Webhook status: {webhook_status}
    - Retry count: {retry_count}

    Reason across all past incidents with this profile and explain:
    1. How often this specific mismatch or pattern has occurred.
    2. What previous actions worked versus what failed (e.g. restarts vs reconciliation).
    3. The specific risk level (especially duplicate-payment risk).
    4. The standard recommended remediation protocol established from past resolutions.
    """.strip()

    return await analyze_incident_patterns(query=query, budget="mid")
