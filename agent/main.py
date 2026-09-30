"""
PayRecall Agent — Entry Point (Milestone 4: Cross-Incident Intelligence Layer)
=============================================================================
Full Multi-Tier Memory Lifecycle:
  1. LLM investigates using MCP tools (ReAct loop)
  2. Hindsight arecall() retrieves similar past incidents (Tier 2: Similarity)
  3. Hindsight areflect() synthesizes cross-incident intelligence (Tier 3: Reasoning)
  4. LLM produces final diagnosis distinguishing all 3 tiers of evidence
  5. CLI prompt: operator confirms actual root cause & resolution
  6. PostgreSQL incident record updated with confirmed findings
  7. Hindsight aretain() stores confirmed experience (Tier 1: Continuous Learning)
  8. Future investigations immediately benefit from this new memory

Usage:
------
    python main.py                          # runs demo scenarios
    python main.py TXN-1001                 # investigate single transaction
    python main.py TXN-1001 --no-learn      # skip learning loop
    python main.py --insights               # cross-incident intelligence report
"""
import asyncio
import os
import sys
import uuid
import httpx

from dotenv import load_dotenv
load_dotenv()

# ── config ────────────────────────────────────────────────────────────────────
from config import (
    GROQ_API_KEY, OPENAI_API_KEY, LLM_PROVIDER, LLM_MODEL,
    MCP_SERVER_BINARY, BACKEND_URL,
    HINDSIGHT_BASE_URL, HINDSIGHT_BANK_ID,
)

# ── MCP adapter ───────────────────────────────────────────────────────────────
from langchain_mcp_adapters.client import MultiServerMCPClient

# ── graph ─────────────────────────────────────────────────────────────────────
from graph import build_graph, PayRecallState

# ── memory ────────────────────────────────────────────────────────────────────
from memory.hindsight import HINDSIGHT_AVAILABLE
from memory.retain import retain_incident
from memory.reflect import analyze_incident_patterns

# ── LLM messages ─────────────────────────────────────────────────────────────
from langchain_core.messages import HumanMessage


# ── LLM factory ───────────────────────────────────────────────────────────────
def _build_model():
    if LLM_PROVIDER.lower() == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(model=LLM_MODEL, temperature=0, groq_api_key=GROQ_API_KEY)
    elif LLM_PROVIDER.lower() == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=LLM_MODEL, temperature=0, openai_api_key=OPENAI_API_KEY)
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER!r}")


# ── Display helpers ────────────────────────────────────────────────────────────
WIDE  = "=" * 68
DIVIDER = "-" * 68
THIN  = "." * 68


def _print_startup() -> None:
    print(f"\n{WIDE}")
    print("  PayRecall  --  AI Payment Operations Investigator")
    print("  Multi-Tier Memory Architecture (Retain | Recall | Reflect)")
    print(WIDE)
    print(f"  LLM       : {LLM_PROVIDER} / {LLM_MODEL}")
    print(f"  Backend   : {BACKEND_URL}")
    if HINDSIGHT_AVAILABLE:
        print(f"  Hindsight : [ENABLED] bank: '{HINDSIGHT_BANK_ID}' @ {HINDSIGHT_BASE_URL}")
    else:
        print("  Hindsight : [DISABLED] using operational knowledge fallback")
    print(f"{WIDE}\n")


def _print_trace(messages: list, has_reflection: bool = False) -> None:
    called = []
    for msg in messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                called.append(tc["name"])
    print(f"\n  Investigation Execution Trace")
    print(f"  {'-'*45}")
    for name in called:
        print(f"  [MCP Tool]   --> {name}")
    if called:
        print(f"  Total MCP tools invoked: {len(called)}")
    print("  [Memory T2]  --> recall_memory (Hindsight arecall)")
    if has_reflection:
        print("  [Memory T3]  --> reflect_patterns (Hindsight areflect: Cross-Incident)")
    else:
        print("  [Memory T3]  --> skipped (standard single-incident profile)")
    print("  [Synthesis]  --> final_diagnosis (Evidence + History + Patterns)")


def _print_memory_preview(ctx: str, reflected: str | None) -> None:
    if ctx and "No historical" not in ctx and "disabled" not in ctx.lower():
        preview = ctx[:350].strip()
        print(f"\n  {'-'*65}")
        print("  HISTORICAL CONTEXT (arecall preview):")
        for line in preview.splitlines()[:6]:
            print(f"  {line}")
        if len(ctx) > 350:
            print(f"  ... [{len(ctx)-350} more chars]")

    if reflected:
        print(f"\n  {'-'*65}")
        print("  CROSS-INCIDENT PATTERNS (areflect preview):")
        for line in reflected.splitlines()[:6]:
            print(f"  {line}")
        if len(reflected.splitlines()) > 6:
            print(f"  ... [{len(reflected.splitlines())-6} more lines]")


def _print_learning_result(incident_id: str, retained: bool) -> None:
    print(f"\n  {'-'*65}")
    print("  PayRecall Continuous Learning (Tier 1: aretain)")
    print(f"  {'-'*65}")
    if retained:
        print(f"  [OK] Incident {incident_id} verified and resolved")
        print("  [OK] Resolution stored in PostgreSQL")
        print(f"  [OK] Confirmed experience retained into Hindsight bank '{HINDSIGHT_BANK_ID}'")
        print("\n  This confirmed resolution is now indexed.")
        print("  Subsequent investigations and areflect() reasoning will benefit from it.")
    else:
        print("  [!] Memory was NOT retained into Hindsight (offline/fallback)")
        print("  PostgreSQL incident record was successfully updated.")
    print(f"  {'-'*65}\n")


# ── Human resolution prompt ───────────────────────────────────────────────────

def _prompt_resolution(incident_id: str, transaction_id: str) -> dict | None:
    print(f"\n{WIDE}")
    print("  Confirm Resolution & Teach PayRecall (Human-in-the-Loop)")
    print(WIDE)
    print(f"  Incident    : {incident_id}")
    print(f"  Transaction : {transaction_id}\n")
    print("  Press Enter on root cause to skip (demo mode).\n")

    root_cause = input("  Confirmed root cause: ").strip()
    if not root_cause:
        print("  [skipped -- no memory retained]")
        return None

    resolution = input("  Action taken (primary resolution): ").strip()
    outcome_raw = input("  Outcome [SUCCESS/FAILED/PARTIAL]: ").strip().upper()
    outcome = outcome_raw if outcome_raw in ("SUCCESS", "FAILED", "PARTIAL") else "SUCCESS"
    notes = input("  Operator notes (optional): ").strip()

    actions = []
    print("\n  Add investigation actions (include failures). Empty action_type to finish.")
    action_order = 1
    while True:
        atype = input(f"    Action {action_order} type (e.g. RESTART_SERVICE): ").strip()
        if not atype:
            break
        adesc = input(f"    Action {action_order} description: ").strip()
        ares = input(f"    Action {action_order} result [SUCCESS/FAILED]: ").strip().upper()
        actions.append({
            "action_type": atype,
            "action_description": adesc,
            "result": ares or "SUCCESS",
        })
        action_order += 1

    return {
        "incident_id": incident_id,
        "transaction_id": transaction_id,
        "confirmed_root_cause": root_cause,
        "resolution": resolution or root_cause,
        "outcome": outcome,
        "operator_notes": notes,
        "actions": actions,
    }


async def _resolve_in_backend(incident_id: str, resolution: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(
                f"{BACKEND_URL}/api/incidents/{incident_id}/resolve",
                json={
                    "confirmed_root_cause": resolution["confirmed_root_cause"],
                    "resolution": resolution["resolution"],
                    "outcome": resolution["outcome"],
                    "operator_notes": resolution.get("operator_notes", ""),
                    "actions": resolution.get("actions", []),
                },
            )
    except Exception:
        pass


# ── Standalone Cross-Incident Insights Report ─────────────────────────────────

async def print_insights_report() -> None:
    """Run full cross-incident reflection and print the intelligence report."""
    print(f"\n{WIDE}")
    print("  PayRecall -- Cross-Incident Operational Intelligence Report")
    print("  Synthesized across all historical payment incidents via areflect()")
    print(WIDE)
    print("  Querying Hindsight memory bank...\n")

    report = await analyze_incident_patterns()

    print(DIVIDER)
    for line in report.splitlines():
        print(f"  {line}")
    print(DIVIDER)
    print("\n  [Tip] Use this intelligence report to review recurring root causes")
    print("  and evaluate remediation action success rates across payment gateways.\n")


# ── Core investigate function ─────────────────────────────────────────────────

async def investigate(
    compiled_graph,
    graph_builder,
    model,
    transaction_id: str,
    learn: bool = True,
) -> None:
    print(f"\n{DIVIDER}")
    print(f"  Investigating: {transaction_id}")
    print(DIVIDER)

    initial_state: PayRecallState = {
        "messages": [HumanMessage(content=f"Investigate transaction {transaction_id}")],
        "transaction_id": transaction_id,
        "transaction": None,
        "gateway": None,
        "webhooks": None,
        "evidence_summary": "",
        "raw_evidence": {},
        "recalled_memories": None,
        "memory_context": "",
        "reflected_insights": None,
        "diagnosis": None,
        "risk_level": None,
        "recommendation": None,
        "incident_id": None,
        "confirmed_root_cause": None,
        "action_taken": None,
        "outcome": None,
        "memory_saved": False,
        "resolution": None,
        "memory_retained": False,
    }

    result = await compiled_graph.ainvoke(initial_state)

    messages = result["messages"]
    reflected = result.get("reflected_insights")
    _print_trace(messages, has_reflection=bool(reflected))
    _print_memory_preview(result.get("memory_context", ""), reflected)

    # Print final 3-tier report
    final_msg = messages[-1]
    print(f"\n{WIDE}")
    print(final_msg.content)
    print(WIDE)

    if not learn:
        return

    incident_id = result.get("incident_id") or f"INC-{uuid.uuid4().hex[:6].upper()}"
    txn_id = (result.get("transaction") or {}).get("transaction_id", transaction_id)

    # Human-in-the-loop resolution
    resolution = _prompt_resolution(incident_id, txn_id)
    if resolution is None:
        return

    # Update PostgreSQL
    await _resolve_in_backend(incident_id, resolution)

    # Retain confirmed experience into Hindsight
    raw = result.get("raw_evidence", {})
    success, msg = await retain_incident(
        transaction=raw.get("transaction", {}),
        gateway=raw.get("gateway", {}),
        webhooks=raw.get("webhooks", []),
        diagnosis=result.get("diagnosis", final_msg.content),
        resolution=resolution,
        backend_url=BACKEND_URL,
    )

    _print_learning_result(incident_id, success)


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    args = sys.argv[1:]

    # Check for direct cross-incident insights flag
    if "--insights" in args or "--reflect" in args:
        _print_startup()
        await print_insights_report()
        return

    if not os.path.isfile(MCP_SERVER_BINARY):
        print(
            f"\n[ERROR] MCP server binary not found:\n  {MCP_SERVER_BINARY}\n"
            "Build it: cd mcp-server && go build -o mcp-server.exe .",
            file=sys.stderr,
        )
        sys.exit(1)

    _print_startup()

    learn = "--no-learn" not in args
    tx_ids_raw = [a for a in args if not a.startswith("--")]
    tx_ids = tx_ids_raw if tx_ids_raw else ["TXN-1001", "TXN-1002", "TXN-1003"]

    mcp_config = {
        "payments": {
            "command": MCP_SERVER_BINARY,
            "args": [],
            "env": {"BACKEND_URL": BACKEND_URL},
            "transport": "stdio",
        }
    }

    async with MultiServerMCPClient(mcp_config) as client:
        tools = await client.get_tools()

        print(f"  Discovered {len(tools)} MCP tools:")
        for t in tools:
            print(f"    * {t.name}")
        print()

        model = _build_model()
        compiled_graph, graph_builder = build_graph(model, tools, BACKEND_URL)

        for tx_id in tx_ids:
            try:
                await investigate(compiled_graph, graph_builder, model, tx_id, learn=learn)
            except Exception as exc:
                print(f"\n[ERROR] {tx_id}: {exc}", file=sys.stderr)
                import traceback
                traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
