"""
LangGraph investigation graph for PayRecall — with Hindsight Multi-Tier Memory.

Graph Topology (Milestone 4: Cross-Incident Intelligence Layer):

    START
      │
      ▼
  agent_investigate  ──tool calls──►  tool_node (MCP)
      ▲                                    │
      └────────────────────────────────────┘
      │  (ReAct loop — LLM decides all tool calls)
      ▼
  recall_memory          ← Hindsight arecall() [Tier 2: Similar Incidents]
      │
      ▼
  should_reflect?
      ├── "reflect_patterns" ──► reflect_patterns  ← Hindsight areflect() [Tier 3: Org Patterns]
      │                                   │
      └── "final_diagnosis" ──────────────┴──► final_diagnosis
                                                     │
                                                     ▼
                                                open_incident (PostgreSQL)
                                                     │
                                                     ▼
                                                    END

  [Operator Confirm] ──► retain_memory (Hindsight aretain()) [Tier 1: Continuous Learning]
"""
import json
from typing import Annotated, Literal, Optional
from typing_extensions import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
import httpx

from prompts import INVESTIGATION_PROMPT, SYNTHESIS_PROMPT
from memory.hindsight import hindsight, BANK_ID, HINDSIGHT_AVAILABLE
from memory.retain import retain_incident
from memory.reflect import reflect_on_symptom_pattern


# ── Full investigation state ──────────────────────────────────────────────────
class PayRecallState(MessagesState):
    """Complete state for one investigation cycle with 3 tiers of memory."""
    # Live transaction entities
    transaction_id: str
    transaction: Optional[dict]
    gateway: Optional[dict]
    webhooks: Optional[list]

    # Tool evidence
    evidence_summary: str
    raw_evidence: dict

    # Memory Tier 2: recall()
    recalled_memories: Optional[list]
    memory_context: str

    # Memory Tier 3: reflect()
    reflected_insights: Optional[str]

    # Diagnosis phase
    diagnosis: Optional[str]
    risk_level: Optional[str]
    recommendation: Optional[str]

    # Incident lifecycle & learning
    incident_id: Optional[str]
    confirmed_root_cause: Optional[str]
    action_taken: Optional[str]
    outcome: Optional[str]
    memory_saved: bool
    resolution: Optional[dict]
    memory_retained: bool


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_recall_query(evidence_summary: str) -> str:
    return f"""
Find historically similar payment incidents based on this current evidence:

{evidence_summary}

Return incidents with:
- Similar symptom patterns (internal status, gateway status, webhook outcomes)
- Root causes that were identified
- Investigation actions that worked AND actions that failed
- Any duplicate-payment or retry risks encountered
- Key lessons learned from the resolution

Focus on cases where the status combination (internal/gateway/webhook) matches closely.
""".strip()


def _format_memories(recall_result) -> tuple[str, list]:
    if recall_result is None:
        return "No historical incidents found.", []
    memories = getattr(recall_result, "results", recall_result)
    if not memories:
        return "No historical incidents found.", []

    lines = []
    mem_list = []
    for i, mem in enumerate(memories, start=1):
        text = getattr(mem, "text", str(mem))
        lines.append(f"Historical Memory {i}:\n{text.strip()}")
        mem_list.append(text.strip())

    sep = "\n\n" + "─" * 60 + "\n\n"
    return "\n\n" + sep.join(lines), mem_list


def _parse_raw_evidence(messages: list) -> dict:
    """Extract structured evidence from tool response messages."""
    evidence = {"transaction": {}, "gateway": {}, "webhooks": []}
    for msg in messages:
        if not isinstance(msg, ToolMessage):
            continue
        try:
            data = json.loads(msg.content)
        except Exception:
            continue

        if isinstance(data, dict):
            if "internal_status" in data:
                evidence["transaction"] = data
            elif "gateway_status" in data:
                evidence["gateway"] = data
            elif "attempts" in data:
                evidence["webhooks"] = data.get("attempts", [])
    return evidence


# ── Graph builder ─────────────────────────────────────────────────────────────

def build_graph(model, tools: list, backend_url: str = "http://localhost:8080"):
    """
    Build the full PayRecall multi-tier investigation graph.
    """
    model_with_tools = model.bind_tools(tools)

    # ── Node 1: agent_investigate (ReAct MCP loop) ─────────────────────────────
    def agent_investigate(state: PayRecallState):
        messages = state["messages"]
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=INVESTIGATION_PROMPT)] + messages
        response = model_with_tools.invoke(messages)
        return {"messages": [response]}

    # ── Node 2: tool_node ─────────────────────────────────────────────────────
    tool_node = ToolNode(tools)

    # ── Edge: should_investigate_more ─────────────────────────────────────────
    def should_investigate_more(state: PayRecallState) -> Literal["tools", "recall_memory"]:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "recall_memory"

    # ── Node 3: recall_memory (Tier 2: arecall) ───────────────────────────────
    async def recall_memory(state: PayRecallState):
        last_ai = next(
            (m for m in reversed(state["messages"]) if isinstance(m, AIMessage)),
            None,
        )
        evidence_text = last_ai.content if last_ai else "No evidence gathered."
        raw_evidence = _parse_raw_evidence(state["messages"])

        txn = raw_evidence.get("transaction", {})
        gw = raw_evidence.get("gateway", {})
        whs = raw_evidence.get("webhooks", [])
        txn_id = txn.get("transaction_id", state.get("transaction_id", "UNKNOWN"))

        memory_context = "Hindsight memory is disabled or unavailable."
        recalled_list = []

        if HINDSIGHT_AVAILABLE and hindsight is not None:
            try:
                result = await hindsight.arecall(
                    bank_id=BANK_ID,
                    query=_build_recall_query(evidence_text),
                )
                memory_context, recalled_list = _format_memories(result)
            except Exception as exc:
                memory_context = f"Memory recall notice: {exc}"

        return {
            "transaction_id": txn_id,
            "transaction": txn,
            "gateway": gw,
            "webhooks": whs,
            "evidence_summary": evidence_text,
            "raw_evidence": raw_evidence,
            "memory_context": memory_context,
            "recalled_memories": recalled_list,
        }

    # ── Conditional Edge: should_reflect ──────────────────────────────────────
    def should_reflect(state: PayRecallState) -> Literal["reflect_patterns", "final_diagnosis"]:
        """
        Decide whether to invoke cross-incident reflection (areflect).
        Triggered when deeper reasoning across historical cases is valuable:
          - FAILED + AUTHORIZED mismatch
          - Retried transactions (retry_count > 0)
          - PENDING + AUTHORIZED stuck states
          - Webhook failures / timeouts
        """
        txn = state.get("transaction") or {}
        gw = state.get("gateway") or {}
        whs = state.get("webhooks") or []

        int_status = txn.get("internal_status", "").upper()
        gw_status = gw.get("gateway_status", "").upper()
        retry_count = txn.get("retry_count", 0)

        # 1. State mismatch
        if int_status in ("FAILED", "PENDING") and gw_status == "AUTHORIZED":
            return "reflect_patterns"

        # 2. Repeated retry attempts
        if retry_count > 0:
            return "reflect_patterns"

        # 3. Webhook timeouts or errors
        has_webhook_failure = any(
            w.get("webhook_status") in ("TIMEOUT", "FAILED") or (w.get("http_status", 0) >= 500)
            for w in whs
        )
        if has_webhook_failure:
            return "reflect_patterns"

        return "final_diagnosis"

    # ── Node 4: reflect_patterns (Tier 3: areflect) ────────────────────────────
    async def reflect_patterns(state: PayRecallState):
        txn = state.get("transaction") or {}
        gw = state.get("gateway") or {}
        whs = state.get("webhooks") or []

        int_status = txn.get("internal_status", "UNKNOWN")
        gw_status = gw.get("gateway_status", "UNKNOWN")
        wh_status = whs[-1].get("webhook_status", "NONE") if whs else "NONE"
        retry_count = txn.get("retry_count", 0)

        insights = await reflect_on_symptom_pattern(
            internal_status=int_status,
            gateway_status=gw_status,
            webhook_status=wh_status,
            retry_count=retry_count,
        )

        return {"reflected_insights": insights}

    # ── Node 5: final_diagnosis (Synthesizes 3 Tiers) ──────────────────────────
    def final_diagnosis(state: PayRecallState):
        evidence = state.get("evidence_summary", "No evidence gathered.")
        memory = state.get("memory_context", "No historical context available.")
        insights = state.get(
            "reflected_insights",
            "Single-incident standard workflow; general cross-incident reflection was not triggered.",
        )

        synthesis_input = f"""
CURRENT EVIDENCE (MCP Tools)
=============================
{evidence}


SIMILAR HISTORICAL INCIDENTS (Hindsight arecall)
=================================================
{memory}


CROSS-INCIDENT LEARNING (Hindsight areflect)
=============================================
{insights}


Produce the final PayRecall investigation report following the specified format strictly.
""".strip()

        response = model.invoke([
            SystemMessage(content=SYNTHESIS_PROMPT),
            HumanMessage(content=synthesis_input),
        ])

        content = response.content
        risk = "MEDIUM"
        for level in ["HIGH", "LOW", "MEDIUM"]:
            if f"RISK\n----\n{level}" in content or f"Risk\n----\n{level}" in content or level in content:
                risk = level
                break

        return {
            "messages": [response],
            "diagnosis": content,
            "risk_level": risk,
            "recommendation": content,
        }

    # ── Node 6: open_incident (PostgreSQL) ─────────────────────────────────────
    async def open_incident(state: PayRecallState):
        txn = state.get("raw_evidence", {}).get("transaction", {})
        txn_id = txn.get("transaction_id", state.get("transaction_id", "UNKNOWN"))
        diagnosis_text = state.get("diagnosis", "")
        risk = state.get("risk_level", "UNKNOWN")
        recommendation = state.get("recommendation", "")

        incident_id = "INC-LOCAL"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{backend_url}/api/incidents",
                    json={
                        "transaction_id": txn_id,
                        "agent_diagnosis": diagnosis_text[:2000],
                        "agent_risk_level": risk,
                        "recommendation": recommendation[:2000],
                    },
                )
                if resp.status_code == 201:
                    incident_id = resp.json().get("incident_id", incident_id)
        except Exception:
            pass

        return {"incident_id": incident_id}

    # ── Node 7: retain_memory (Hindsight aretain) ──────────────────────────────
    async def retain_memory(state: PayRecallState):
        resolution = state.get("resolution")
        if not resolution:
            return {"memory_retained": False, "memory_saved": False}

        raw = state.get("raw_evidence", {})
        diagnosis = state.get("diagnosis", "")

        success, message = await retain_incident(
            transaction=raw.get("transaction", {}),
            gateway=raw.get("gateway", {}),
            webhooks=raw.get("webhooks", []),
            diagnosis=diagnosis,
            resolution=resolution,
            backend_url=backend_url,
        )
        return {"memory_retained": success, "memory_saved": success}

    # ── Assemble Graph ────────────────────────────────────────────────────────
    graph = StateGraph(PayRecallState)

    graph.add_node("agent_investigate", agent_investigate)
    graph.add_node("tools", tool_node)
    graph.add_node("recall_memory", recall_memory)
    graph.add_node("reflect_patterns", reflect_patterns)
    graph.add_node("final_diagnosis", final_diagnosis)
    graph.add_node("open_incident", open_incident)
    graph.add_node("retain_memory", retain_memory)

    graph.add_edge(START, "agent_investigate")
    graph.add_conditional_edges(
        "agent_investigate",
        should_investigate_more,
        {"tools": "tools", "recall_memory": "recall_memory"},
    )
    graph.add_edge("tools", "agent_investigate")

    # Branch after recall_memory: should_reflect?
    graph.add_conditional_edges(
        "recall_memory",
        should_reflect,
        {
            "reflect_patterns": "reflect_patterns",
            "final_diagnosis": "final_diagnosis",
        },
    )
    graph.add_edge("reflect_patterns", "final_diagnosis")
    graph.add_edge("final_diagnosis", "open_incident")
    graph.add_edge("open_incident", END)

    return graph.compile(), graph
