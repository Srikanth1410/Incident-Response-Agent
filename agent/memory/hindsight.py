"""
Hindsight memory client for PayRecall.

Provides a single shared client instance used throughout the agent.
All I/O goes through the async variants (aretain, arecall) so this
module is safe to import inside LangGraph async nodes.
"""
import os

from dotenv import load_dotenv

load_dotenv()

# ── Connection settings ───────────────────────────────────────────────────────
HINDSIGHT_BASE_URL: str = os.getenv("HINDSIGHT_BASE_URL", "http://localhost:8888")
HINDSIGHT_API_KEY: str = os.getenv("HINDSIGHT_API_KEY", "")
BANK_ID: str = os.getenv("HINDSIGHT_BANK_ID", "payrecall")

# ── Build client ─────────────────────────────────────────────────────────────
try:
    from hindsight_client import Hindsight

    _kwargs = {"base_url": HINDSIGHT_BASE_URL}
    if HINDSIGHT_API_KEY:
        _kwargs["api_key"] = HINDSIGHT_API_KEY

    hindsight = Hindsight(**_kwargs)
    HINDSIGHT_AVAILABLE = True

except ImportError:
    # Graceful fallback: if the package isn't installed, memory features
    # are disabled but the rest of the agent continues to work.
    hindsight = None  # type: ignore[assignment]
    HINDSIGHT_AVAILABLE = False
    print(
        "[WARNING] hindsight-client not installed. "
        "Memory features are disabled. Run: pip install hindsight-client"
    )
