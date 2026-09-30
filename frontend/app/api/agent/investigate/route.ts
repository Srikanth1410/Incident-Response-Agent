import { NextResponse } from "next/server";
import { InvestigationResponse, HistoricalIncident, MemoryGrowthStats } from "@/types/investigation";

// Module-scoped learning memory state simulating persistent operational learning during session
let hasLearnedDemo001 = false;
let learnedIncident: HistoricalIncident | null = null;
let baseExperiencesCount = 18;

export function recordLearnedIncident(payload: {
  incident_id: string;
  confirmed_root_cause: string;
  action_taken: string;
  outcome: "SUCCESS" | "FAILED" | "PARTIAL";
  notes?: string;
}) {
  hasLearnedDemo001 = true;
  learnedIncident = {
    incident_id: payload.incident_id || "INC-DEMO-001",
    relevance: 0.98,
    symptoms: "FAILED / AUTHORIZED / TIMEOUT",
    root_cause: payload.confirmed_root_cause || "Webhook timeout prevented state reconciliation",
    resolution: payload.action_taken || "Blocked retry and reconciled gateway state",
    outcome: payload.outcome || "SUCCESS",
    why_relevant: [
      "Same internal/gateway mismatch (FAILED internally, AUTHORIZED externally)",
      "Same webhook failure pattern (timeout past 30s threshold)",
      "Confirmed fix: Reconciling gateway prevents double billing upon retry",
    ],
  };
}

export function getMemoryGrowthStats(): MemoryGrowthStats {
  return {
    resolved_experiences: hasLearnedDemo001 ? baseExperiencesCount + 1 : baseExperiencesCount,
    successful_resolutions: hasLearnedDemo001 ? 14 : 13,
    failed_actions_learned: 9,
    recurring_patterns: 6,
    last_learned_incident: hasLearnedDemo001 ? (learnedIncident?.incident_id || "INC-DEMO-001") : undefined,
    has_new_growth: hasLearnedDemo001,
  };
}

export async function POST(req: Request) {
  try {
    const { transaction_id } = await req.json();
    const id = (transaction_id || "TXN-DEMO-001").trim().toUpperCase();

    const growth = getMemoryGrowthStats();

    // ────────────────────────────────────────────────────────────
    // DEMO A — TXN-DEMO-001 (BASELINE INCIDENT - BEFORE LEARNING)
    // ────────────────────────────────────────────────────────────
    if (id === "TXN-DEMO-001") {
      return NextResponse.json({
        incident_id: "INC-DEMO-001",
        learning_stage: hasLearnedDemo001 ? "AFTER_LEARNING" : "BEFORE_LEARNING",
        transaction: {
          transaction_id: "TXN-DEMO-001",
          amount: 54000,
          currency: "INR",
          internal_status: "FAILED",
          merchant_id: "MERCHANT-DEMO-A",
          retry_count: 0,
          created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
        gateway: {
          gateway_status: "AUTHORIZED",
          gateway_reference: "AUTH-DEMO-99120",
          amount: 54000,
          currency: "INR",
          response_code: "200_AUTH_OK",
          authorized_at: new Date(Date.now() - 4 * 3600000 + 12000).toISOString(),
        },
        webhooks: [
          {
            attempt_number: 1,
            status: "TIMEOUT",
            webhook_status: "TIMEOUT",
            http_status: 504,
            error_message: "Connection timed out after 30s",
            timestamp: new Date(Date.now() - 4 * 3600000 + 42000).toISOString(),
          },
        ],
        trace: [
          "get_transaction",
          "get_gateway_status",
          "get_webhook_attempts",
          "hindsight_recall",
          "hindsight_reflect",
        ],
        memories: hasLearnedDemo001 && learnedIncident ? [learnedIncident] : [],
        insights: {
          common_pattern: "Potential external gateway vs internal ledger mismatch",
          successful_action: "Pending human-confirmed organizational resolution",
          failed_action: "Automated retry worker firing without verification",
          highest_risk: "Duplicate payment risk if automatic retry runs",
          summary: hasLearnedDemo001
            ? "Recent confirmed incident INC-DEMO-001 proved gateway reconciliation resolves this state mismatch."
            : "No previous confirmed incident found for this exact failure in Hindsight bank. Agent providing cautious baseline advice.",
        },
        diagnosis: hasLearnedDemo001
          ? "Confirmed webhook-driven state mismatch (backed by recently retained INC-DEMO-001)."
          : "Possible state mismatch. The external payment gateway authorized the charge of ₹54,000, but the internal ledger marked the transaction FAILED after webhook timeout. No confirmed prior resolution exists in operational memory.",
        risk_level: "HIGH",
        recommendation: hasLearnedDemo001
          ? [
              "Block payment retry queue immediately.",
              "Apply confirmed fix from INC-DEMO-001: Reconcile gateway authorization AUTH-DEMO-99120.",
              "Update internal ledger to AUTHORIZED.",
            ]
          : [
              "Verify gateway authorization in dashboard.",
              "Inspect webhook timeout logs.",
              "Avoid immediate retry until state is verified.",
            ],
        comparison: {
          without_memory: {
            diagnosis: "Possible gateway/internal state mismatch",
            recommendation: [
              "Verify gateway authorization in dashboard",
              "Inspect webhook timeout logs",
              "Avoid immediate retry until state is verified",
            ],
            confidence: "Cautious Baseline (No confirmed memory)",
          },
          with_memory: {
            diagnosis: "Likely webhook-driven state reconciliation failure",
            historical_evidence: "Pending human confirmation (Click below to teach PayRecall)",
            previous_fix: "Block retry + reconcile gateway state",
            risk: "HIGH duplicate-payment risk",
            recommendation: [
              "Confirm resolution below to teach PayRecall",
              "Store incident into Hindsight memory",
            ],
          },
        },
        memory_growth: growth,
      });
    }

    // ────────────────────────────────────────────────────────────
    // DEMO B — TXN-DEMO-002 (SIMILAR INCIDENT - AFTER LEARNING)
    // ────────────────────────────────────────────────────────────
    if (id === "TXN-DEMO-002") {
      const recalledMemory: HistoricalIncident = learnedIncident || {
        incident_id: "INC-DEMO-001",
        relevance: 0.98,
        symptoms: "FAILED / AUTHORIZED / TIMEOUT",
        root_cause: "Webhook-driven state mismatch",
        resolution: "Block retry and reconcile the gateway authorization",
        outcome: "SUCCESS",
        why_relevant: [
          "A recently resolved incident (INC-DEMO-001) showed the exact same pattern",
          "Same internal FAILED and external AUTHORIZED mismatch",
          "Previous confirmed fix: Reconciling gateway authorization before retry",
        ],
      };

      return NextResponse.json({
        incident_id: "INC-DEMO-002",
        learning_stage: "AFTER_LEARNING",
        transaction: {
          transaction_id: "TXN-DEMO-002",
          amount: 54000,
          currency: "INR",
          internal_status: "FAILED",
          merchant_id: "MERCHANT-DEMO-B",
          retry_count: 1,
          created_at: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        gateway: {
          gateway_status: "AUTHORIZED",
          gateway_reference: "AUTH-DEMO-77192",
          amount: 54000,
          currency: "INR",
          response_code: "200_AUTH_OK",
          authorized_at: new Date(Date.now() - 30 * 60000 + 8000).toISOString(),
        },
        webhooks: [
          {
            attempt_number: 1,
            status: "TIMEOUT",
            webhook_status: "TIMEOUT",
            http_status: 504,
            error_message: "Connection timed out after 30s",
            timestamp: new Date(Date.now() - 30 * 60000 + 38000).toISOString(),
          },
        ],
        trace: [
          "get_transaction",
          "get_gateway_status",
          "get_webhook_attempts",
          "hindsight_recall",
          "hindsight_reflect",
        ],
        memories: [recalledMemory],
        insights: {
          common_pattern: "Webhook-driven state mismatch",
          successful_action: "Block retry and reconcile gateway authorization",
          failed_action: "Premature retry queue triggering second charge",
          highest_risk: "FAILED internally + AUTHORIZED externally creates duplicate charge",
          summary:
            "A recently resolved incident (INC-DEMO-001) showed the exact same pattern. Previous confirmed root cause: Webhook-driven state mismatch. Previous successful resolution: Block retry and reconcile gateway authorization.",
        },
        diagnosis:
          "A recently resolved incident (INC-DEMO-001) showed the same pattern. Previous confirmed root cause: Webhook-driven state mismatch. Previous successful resolution: Block retry and reconcile the gateway authorization. Current duplicate-payment risk: HIGH.",
        risk_level: "HIGH",
        recommendation: [
          "Block payment retry queue immediately (do not trigger retry #2).",
          "Verify existing gateway authorization (AUTH-DEMO-77192).",
          "Apply confirmed fix from INC-DEMO-001: Reconcile gateway authorization & update internal ledger to AUTHORIZED.",
          "Dispatch confirmed ledger settlement status to merchant.",
        ],
        comparison: {
          without_memory: {
            diagnosis: "Possible gateway/internal state mismatch",
            recommendation: [
              "Inspect gateway and webhook state",
              "Consider standard retry",
            ],
            confidence: "Generic Heuristic (Without historical memory)",
          },
          with_memory: {
            diagnosis: "Likely webhook-driven state reconciliation failure",
            historical_evidence: `${recalledMemory.incident_id} (Recently confirmed resolution)`,
            previous_fix: recalledMemory.resolution,
            risk: "HIGH duplicate-payment risk",
            recommendation: [
              "Block retry immediately",
              "Reconcile gateway authorization AUTH-DEMO-77192",
              "Update internal ledger to AUTHORIZED",
            ],
          },
        },
        memory_growth: growth,
      });
    }

    // ────────────────────────────────────────────────────────────
    // DEMO C — TXN-DEMO-003 (PROVE NO BLIND REUSE - ACTUALLY DECLINED)
    // ────────────────────────────────────────────────────────────
    if (id === "TXN-DEMO-003") {
      return NextResponse.json({
        incident_id: "INC-DEMO-003",
        learning_stage: "NON_MATCHING_REASONING",
        transaction: {
          transaction_id: "TXN-DEMO-003",
          amount: 12500,
          currency: "INR",
          internal_status: "FAILED",
          merchant_id: "MERCHANT-DEMO-C",
          retry_count: 0,
          created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        gateway: {
          gateway_status: "DECLINED",
          gateway_reference: "GW-DEC-12004",
          amount: 12500,
          currency: "INR",
          response_code: "05_INSUFFICIENT_FUNDS",
          authorized_at: new Date(Date.now() - 15 * 60000 + 4000).toISOString(),
        },
        webhooks: [
          {
            attempt_number: 1,
            status: "SUCCESS",
            webhook_status: "SUCCESS",
            http_status: 200,
            timestamp: new Date(Date.now() - 15 * 60000 + 6000).toISOString(),
          },
        ],
        trace: [
          "get_transaction",
          "get_gateway_status",
          "get_webhook_attempts",
          "hindsight_recall",
          "hindsight_reflect",
        ],
        memories: [
          {
            incident_id: "INC-002",
            relevance: 0.94,
            symptoms: "FAILED / DECLINED / SUCCESS",
            root_cause: "Legitimate issuer card decline (insufficient funds)",
            resolution: "Advise customer to use alternative payment method",
            outcome: "CLOSED",
            why_relevant: [
              "Consistent internal and external decline states",
              "Evaluated INC-DEMO-001 but rejected as non-matching (gateway DECLINED, not AUTHORIZED)",
              "Proves agent combines current evidence + reasoning rather than blindly copying memory",
            ],
          },
        ],
        insights: {
          common_pattern: "Consistent decline across gateway and platform",
          successful_action: "Prompt customer for alternative payment method",
          failed_action: "Applying reconciliation or force-retrying same card",
          highest_risk: "LOW risk of duplicate payment or state desync",
          summary:
            "This does NOT match the previous authorization/webhook-timeout pattern. Gateway actually declined the payment. Duplicate-payment risk is low. Do NOT apply the reconciliation fix from previous incidents.",
        },
        diagnosis:
          "This does NOT match the previous authorization/webhook-timeout pattern. The payment gateway legitimately declined the payment (Code 05 - Insufficient Funds). Duplicate-payment risk is low. Do NOT apply the reconciliation fix from previous incidents.",
        risk_level: "LOW",
        recommendation: [
          "Do NOT apply the reconciliation fix from previous incidents.",
          "Maintain internal status as FAILED (consistent with gateway decline).",
          "Prompt customer to use an alternative payment method.",
        ],
        comparison: {
          without_memory: {
            diagnosis: "Transaction failed",
            recommendation: ["Notify customer of decline"],
            confidence: "Standard decline",
          },
          with_memory: {
            diagnosis: "Differentiated decline: Proves agent does NOT blindly copy INC-DEMO-001 memory",
            historical_evidence: "INC-DEMO-001 rejected because gateway responded DECLINED (not AUTHORIZED)",
            previous_fix: "Reconciliation fix rejected: No funds held at gateway",
            risk: "LOW duplicate-payment risk",
            recommendation: [
              "Do not reconcile",
              "Advise customer to use alternate card or UPI",
            ],
          },
        },
        memory_growth: growth,
      });
    }

    // ────────────────────────────────────────────────────────────
    // LEGACY & CUSTOM TXN IDS (TXN-1001, TXN-1002, TXN-1003)
    // ────────────────────────────────────────────────────────────
    if (id === "TXN-1001") {
      return NextResponse.json({
        incident_id: "INC-101",
        learning_stage: "AFTER_LEARNING",
        transaction: {
          transaction_id: "TXN-1001",
          amount: 42000,
          currency: "INR",
          internal_status: "FAILED",
          merchant_id: "MERCH-882",
          retry_count: 1,
          created_at: "2026-09-30T10:14:00Z",
        },
        gateway: {
          gateway_status: "AUTHORIZED",
          gateway_reference: "GW-AUTH-992144",
          amount: 42000,
          currency: "INR",
          response_code: "200_AUTH_OK",
          authorized_at: "2026-09-30T10:14:18Z",
        },
        webhooks: [
          {
            attempt_number: 1,
            status: "TIMEOUT",
            webhook_status: "TIMEOUT",
            http_status: 504,
            error_message: "Connection timed out after 30000ms",
            timestamp: "2026-09-30T10:14:49Z",
          },
        ],
        trace: [
          "get_transaction",
          "get_gateway_status",
          "get_webhook_attempts",
          "hindsight_recall",
          "hindsight_reflect",
        ],
        memories: [
          {
            incident_id: "INC-101",
            relevance: 0.94,
            symptoms: "FAILED / AUTHORIZED / TIMEOUT",
            root_cause: "Webhook state mismatch after endpoint gateway lag",
            resolution: "Reconcile gateway authorization & update ledger",
            outcome: "SUCCESS",
            why_relevant: [
              "Same internal/gateway mismatch (FAILED internally, AUTHORIZED externally)",
              "Same webhook failure pattern (timeout past grace period)",
              "Same duplicate-payment risk upon retry",
            ],
          },
          {
            incident_id: "INC-087",
            relevance: 0.82,
            symptoms: "FAILED / AUTHORIZED / TIMEOUT",
            root_cause: "Duplicate authorization after premature retry by payment queue",
            resolution: "Void second authorization and reconcile initial transaction",
            outcome: "SUCCESS",
            why_relevant: [
              "Identical race condition between worker timeout and gateway webhook",
              "Demonstrates failure mode of automatic retry queues",
            ],
          },
        ],
        insights: {
          common_pattern: "Webhook-driven state mismatch",
          successful_action: "Gateway reconciliation before retry",
          failed_action: "Blind service restart or automatic retry trigger",
          highest_risk: "FAILED internally + AUTHORIZED externally creates duplicate charge",
          summary:
            "Across historical incidents, gateway reconciliation resolved this pattern with 100% success. Blind retry caused duplicate authorization previously. Service restart did not resolve similar incidents.",
        },
        diagnosis:
          "Likely webhook-driven state mismatch. The external payment gateway successfully authorized the charge of ₹42,000, but the internal platform marked the transaction as FAILED due to a downstream webhook delivery timeout.",
        risk_level: "HIGH",
        recommendation: [
          "Block payment retry queue immediately to avoid double debit.",
          "Verify existing gateway authorization (GW-AUTH-992144).",
          "Reconcile internal transaction state from FAILED to AUTHORIZED.",
          "Dispatch confirmed ledger status notification to merchant.",
        ],
        comparison: {
          without_memory: {
            diagnosis: "Possible gateway/internal state mismatch",
            recommendation: ["Inspect gateway and webhook state"],
            confidence: "Generic Heuristic",
          },
          with_memory: {
            diagnosis: "Likely webhook-driven state reconciliation failure",
            historical_evidence: "INC-101 (94% relevant)",
            previous_fix: "Reconcile gateway authorization & update ledger",
            risk: "HIGH duplicate-payment risk",
            recommendation: [
              "Block retry",
              "Verify gateway authorization",
              "Reconcile transaction",
            ],
          },
        },
        memory_growth: growth,
      });
    }

    if (id === "TXN-1002") {
      return NextResponse.json({
        incident_id: "INC-102",
        learning_stage: "NON_MATCHING_REASONING",
        transaction: {
          transaction_id: "TXN-1002",
          amount: 15400,
          currency: "INR",
          internal_status: "FAILED",
          merchant_id: "MERCH-410",
          retry_count: 0,
          created_at: "2026-09-30T11:02:10Z",
        },
        gateway: {
          gateway_status: "DECLINED",
          gateway_reference: "GW-DEC-33129",
          amount: 15400,
          currency: "INR",
          response_code: "51_INSUFFICIENT_FUNDS",
          authorized_at: "2026-09-30T11:02:12Z",
        },
        webhooks: [
          {
            attempt_number: 1,
            status: "DELIVERED",
            webhook_status: "SUCCESS",
            http_status: 200,
            timestamp: "2026-09-30T11:02:15Z",
          },
        ],
        trace: [
          "get_transaction",
          "get_gateway_status",
          "get_webhook_attempts",
          "hindsight_recall",
        ],
        memories: [
          {
            incident_id: "INC-044",
            relevance: 0.91,
            symptoms: "FAILED / DECLINED / SUCCESS",
            root_cause: "Legitimate bank decline (insufficient funds / limit exceeded)",
            resolution: "No intervention required. Retain declined status.",
            outcome: "SUCCESS",
            why_relevant: [
              "Consistent internal and external decline states",
              "Clean webhook delivery to merchant",
            ],
          },
        ],
        insights: {
          common_pattern: "Consistent decline across gateway and platform",
          successful_action: "Do not alter status; allow customer to retry with alternate method",
          failed_action: "Force retry with same payment method",
          highest_risk: "LOW risk of duplicate payment or state desync",
        },
        diagnosis:
          "Normal and consistent decline. Gateway responded with code 51 (Insufficient Funds). Webhook was delivered successfully to merchant.",
        risk_level: "LOW",
        recommendation: [
          "No ledger override needed.",
          "Notify customer to select alternate payment method.",
          "Ensure retry threshold is respected.",
        ],
        memory_growth: growth,
      });
    }

    if (id === "TXN-1003") {
      return NextResponse.json({
        incident_id: "INC-103",
        learning_stage: "AFTER_LEARNING",
        transaction: {
          transaction_id: "TXN-1003",
          amount: 89000,
          currency: "INR",
          internal_status: "PENDING",
          merchant_id: "MERCH-905",
          retry_count: 2,
          created_at: "2026-09-30T12:30:00Z",
        },
        gateway: {
          gateway_status: "AUTHORIZED",
          gateway_reference: "GW-AUTH-77810",
          amount: 89000,
          currency: "INR",
          response_code: "200_AUTH_OK",
          authorized_at: "2026-09-30T12:30:15Z",
        },
        webhooks: [
          {
            attempt_number: 1,
            status: "FAILED",
            webhook_status: "FAILED",
            http_status: 500,
            error_message: "Internal server error on merchant endpoint",
            timestamp: "2026-09-30T12:30:35Z",
          },
        ],
        trace: [
          "get_transaction",
          "get_gateway_status",
          "get_webhook_attempts",
          "hindsight_recall",
          "hindsight_reflect",
        ],
        memories: [
          {
            incident_id: "INC-079",
            relevance: 0.89,
            symptoms: "PENDING / AUTHORIZED / HTTP 500",
            root_cause: "Merchant webhook receiver crashed under load",
            resolution: "Replay webhook after merchant endpoint health check passed",
            outcome: "SUCCESS",
            why_relevant: [
              "Merchant receiver returned HTTP 500 on consecutive attempts",
              "Customer funds held at gateway while order remained pending",
            ],
          },
        ],
        insights: {
          common_pattern: "Merchant webhook server error leaving order pending",
          successful_action: "Redrive webhook with backoff after receiver recovers",
          failed_action: "Canceling authorized transaction prematurely",
          highest_risk: "MEDIUM: Customer charged but merchant fulfillment blocked",
        },
        diagnosis:
          "Stuck in PENDING state due to merchant-side HTTP 500 webhook receiver error. Gateway authorization is confirmed and valid.",
        risk_level: "MEDIUM",
        recommendation: [
          "Do not cancel gateway charge.",
          "Check merchant endpoint health status.",
          "Trigger manual webhook redelivery once receiver returns 200.",
        ],
        memory_growth: growth,
      });
    }

    // Dynamic fallback
    return NextResponse.json({
      incident_id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      transaction: {
        transaction_id: id,
        amount: 25000,
        currency: "INR",
        internal_status: "FAILED",
        merchant_id: "MERCH-CUSTOM",
        retry_count: 1,
        created_at: new Date().toISOString(),
      },
      gateway: {
        gateway_status: "AUTHORIZED",
        gateway_reference: `GW-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 25000,
        currency: "INR",
        response_code: "200_AUTH_OK",
        authorized_at: new Date().toISOString(),
      },
      webhooks: [
        {
          attempt_number: 1,
          status: "TIMEOUT",
          webhook_status: "TIMEOUT",
          http_status: 504,
          error_message: "Endpoint timeout",
          timestamp: new Date().toISOString(),
        },
      ],
      trace: [
        "get_transaction",
        "get_gateway_status",
        "get_webhook_attempts",
        "hindsight_recall",
        "hindsight_reflect",
      ],
      memories: [
        {
          incident_id: "INC-101",
          relevance: 0.92,
          symptoms: "FAILED / AUTHORIZED / TIMEOUT",
          root_cause: "Webhook state mismatch after gateway authorization",
          resolution: "Reconcile gateway authorization & update ledger",
          outcome: "SUCCESS",
          why_relevant: [
            "Same internal/gateway mismatch",
            "Same webhook timeout failure pattern",
          ],
        },
      ],
      insights: {
        common_pattern: "Webhook-driven state mismatch",
        successful_action: "Gateway reconciliation before retry",
        failed_action: "Blind service restart",
        highest_risk: "FAILED internally + AUTHORIZED externally creates duplicate charge",
        summary:
          "Across historical incidents: Gateway reconciliation commonly resolved this pattern. Blind retry caused duplicate authorization previously.",
      },
      diagnosis:
        "Likely webhook-driven state mismatch. The external payment gateway authorized the transaction, but the internal platform failed to update after webhook timeout.",
      risk_level: "HIGH",
      recommendation: [
        "Block payment retry queue.",
        "Verify existing gateway authorization.",
        "Reconcile transaction state.",
        "Monitor settlement.",
      ],
      memory_growth: growth,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
