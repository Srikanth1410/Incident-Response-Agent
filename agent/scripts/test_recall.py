"""
scripts/test_recall.py
======================
Standalone test to verify Hindsight recall works BEFORE running the full agent.

Run from the agent/ directory:

    python scripts/test_recall.py

Tests three different recall queries matching our three demo scenarios.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from memory.hindsight import hindsight, BANK_ID, HINDSIGHT_AVAILABLE

DIVIDER = "-" * 70

QUERIES = [
    {
        "label": "Scenario A -- FAILED/AUTHORIZED/TIMEOUT (high risk)",
        "query": """
            Find previous payment incidents where the internal platform status
            was FAILED but the external payment gateway showed AUTHORIZED.
            Webhook delivery timed out. Include resolution steps and any
            duplicate-payment or retry risks.
        """,
    },
    {
        "label": "Scenario B -- FAILED/DECLINED/SUCCESS (normal decline)",
        "query": """
            Find previous payment incidents where both the internal platform
            and the payment gateway showed a declined or failed status,
            and the merchant webhook delivered successfully.
            What was the typical resolution?
        """,
    },
    {
        "label": "Scenario C -- PENDING/AUTHORIZED/HTTP-500 (webhook server error)",
        "query": """
            Find previous payment incidents where the internal transaction
            was stuck in PENDING state while the gateway showed AUTHORIZED,
            and webhook attempts returned HTTP 500 errors.
            What caused this and how was it resolved?
        """,
    },
]


async def main() -> None:
    if not HINDSIGHT_AVAILABLE:
        print("[ERROR] hindsight-client not installed. Run: pip install hindsight-client")
        sys.exit(1)

    print(f"\nPayRecall -- Recall Verification Test")
    print(f"  Bank : {BANK_ID}")
    print(f"  URL  : {os.getenv('HINDSIGHT_BASE_URL', 'http://localhost:8888')}")

    for q in QUERIES:
        print(f"\n{DIVIDER}")
        print(f"  Query: {q['label']}")
        print(DIVIDER)

        try:
            result = await hindsight.arecall(bank_id=BANK_ID, query=q["query"].strip())

            memories = getattr(result, "results", result) if result else []
            if not memories:
                print("  [!] No memories returned. Did you run seed_memories.py?")
                continue

            print(f"  {len(memories)} memory/memories returned:\n")
            for j, mem in enumerate(memories, start=1):
                text = getattr(mem, "text", str(mem))
                print(f"  [{j}] {text[:300]}{'...' if len(text) > 300 else ''}")
                print()

        except Exception as exc:
            print(f"  [X] Recall notice: {exc}")

    print(f"\n{DIVIDER}")
    print("  If you saw relevant incidents above, Hindsight is working correctly.")
    print("  Run the full agent: python main.py")
    print(DIVIDER)


if __name__ == "__main__":
    asyncio.run(main())

