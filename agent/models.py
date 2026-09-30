"""
agent/models.py
===============
Data models for the PayRecall investigation lifecycle.

These are TypedDicts because LangGraph state must be serialisable,
and TypedDict gives us type hints without the overhead of dataclasses.
"""
from typing import Optional, List
from typing_extensions import TypedDict


class IncidentResolution(TypedDict):
    """
    Operator-confirmed resolution for a payment incident.
    Only confirmed facts get stored in Hindsight — never agent guesses.
    """
    incident_id: str
    transaction_id: str
    confirmed_root_cause: str       # What actually caused the problem
    resolution: str                 # The primary action that resolved it
    outcome: str                    # SUCCESS | FAILED | PARTIAL
    operator_notes: Optional[str]   # Free-form ops notes
    actions: Optional[List["ActionRecord"]]  # All actions tried (incl. failures)


class ActionRecord(TypedDict):
    """
    A single investigation action, including failed attempts.
    Storing failures is what makes Hindsight genuinely useful:
    the next agent can say "restarting the service did NOT work before."
    """
    action_type: str          # RESTART_SERVICE | RECONCILE_PAYMENT | etc.
    action_description: str   # Human-readable description
    result: str               # SUCCESS | FAILED | PARTIAL
