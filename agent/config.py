"""
Configuration for the PayRecall agent.
Reads from environment variables (loaded from .env).
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── LLM ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

# Which provider to use: "groq" | "openai"
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")

# Model name inside the chosen provider
# llama-3.3-70b-versatile is the recommended Groq model for tool-calling agents (Sep 2026)
LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

# ── MCP server (stdio binary path) ───────────────────────────────────────────
# Absolute path to the compiled Go MCP server binary.
# Defaults to the sibling mcp-server directory relative to this file.
_agent_dir = os.path.dirname(os.path.abspath(__file__))
_repo_root = os.path.dirname(_agent_dir)

MCP_SERVER_BINARY: str = os.getenv(
    "MCP_SERVER_BINARY",
    os.path.join(_repo_root, "mcp-server", "mcp-server.exe"),
)

# Backend API base URL used by the MCP server
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8080")

# ── Hindsight memory ─────────────────────────────────────────────────────────
# Self-hosted: http://localhost:8888
# Cloud: https://api.hindsight.so (requires HINDSIGHT_API_KEY)
HINDSIGHT_BASE_URL: str = os.getenv("HINDSIGHT_BASE_URL", "http://localhost:8888")
HINDSIGHT_API_KEY: str = os.getenv("HINDSIGHT_API_KEY", "")
HINDSIGHT_BANK_ID: str = os.getenv("HINDSIGHT_BANK_ID", "payrecall")

