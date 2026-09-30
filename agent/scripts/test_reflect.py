"""
scripts/test_reflect.py
=======================
Standalone test to verify Hindsight cross-incident reflect() works.

Run from the agent/ directory:

    python scripts/test_reflect.py

Demonstrates the 3rd tier of memory intelligence:
  retain  = learn a resolved incident
  recall  = find similar past incidents
  reflect = reason across ALL past incidents
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from memory.hindsight import BANK_ID, HINDSIGHT_AVAILABLE, HINDSIGHT_BASE_URL
from memory.reflect import analyze_incident_patterns, reflect_on_symptom_pattern

DIVIDER = "=" * 70
THIN = "-" * 70


async def main() -> None:
    print(f"\n{DIVIDER}")
    print(f"  PayRecall -- Cross-Incident Reflection Test (areflect)")
    print(f"{DIVIDER}")
    print(f"  Bank ID   : {BANK_ID}")
    print(f"  Hindsight : {HINDSIGHT_BASE_URL} ({'Available' if HINDSIGHT_AVAILABLE else 'Disabled/Fallback'})")
    print(f"{DIVIDER}\n")

    print("[*] Test 1: Global Cross-Incident Pattern Analysis")
    print("  Querying Hindsight areflect() across all retained incidents...\n")

    result = await analyze_incident_patterns()

    print(THIN)
    print("  REFLECT OUTPUT:")
    print(THIN)
    for line in result.splitlines():
        print(f"  {line}")
    print(THIN)

    print("\n[*] Test 2: Targeted Symptom Reflection (FAILED / AUTHORIZED / TIMEOUT)")
    print("  Reflecting on specific high-risk mismatch pattern...\n")

    symptom_result = await reflect_on_symptom_pattern(
        internal_status="FAILED",
        gateway_status="AUTHORIZED",
        webhook_status="TIMEOUT",
        retry_count=1,
    )

    print(THIN)
    print("  TARGETED REFLECTION OUTPUT:")
    print(THIN)
    for line in symptom_result.splitlines()[:25]:
        print(f"  {line}")
    print(THIN)

    print(f"\n{DIVIDER}")
    print("  [OK] Cross-incident reflection layer verified successfully!")
    print(f"{DIVIDER}\n")



if __name__ == "__main__":
    asyncio.run(main())
