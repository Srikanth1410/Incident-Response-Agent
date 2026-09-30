import { NextResponse } from "next/server";
import { InvestigationResponse } from "@/types/investigation";

// Demo mock knowledge base fallback when agent API / backend is not running locally
const DEMO_INVESTIGATIONS: Record<string, InvestigationResponse> = {
  "TXN-1001": {
    incident_id: "INC-101",
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
  },
  "TXN-1002": {
    incident_id: "INC-102",
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
  },
  "TXN-1003": {
    incident_id: "INC-103",
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
      {
        attempt_number: 2,
        status: "FAILED",
        webhook_status: "FAILED",
        http_status: 500,
        error_message: "Internal server error on merchant endpoint",
        timestamp: "2026-09-30T12:32:00Z",
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
  },
};

export async function POST(req: Request) {
  try {
    const { transaction_id } = await req.json();
    const id = (transaction_id || "TXN-1001").trim().toUpperCase();

    // 1. First attempt to call actual backend if running on 8080 or agent API
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const txnRes = await fetch(${backendUrl}/api/transactions/, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        const gwRes = await fetch(${backendUrl}/api/transactions//gateway);
        const gwData = gwRes.ok ? await gwRes.ok : null;
        const wbRes = await fetch(${backendUrl}/api/transactions//webhooks);
        const wbData = wbRes.ok ? await wbRes.json() : null;

        // Construct response with real data
        if (DEMO_INVESTIGATIONS[id]) {
          const base = DEMO_INVESTIGATIONS[id];
          return NextResponse.json({
            ...base,
            transaction: { ...base.transaction, ...txnData },
            gateway: gwData ? { ...base.gateway, ...gwData } : base.gateway,
            webhooks: wbData?.attempts || base.webhooks,
          });
        }
      }
    } catch {
      // Backend not running; fallback smoothly to verified demo fixtures
    }

    // 2. Return high-fidelity investigation fixture for prompt or fallback
    if (DEMO_INVESTIGATIONS[id]) {
      return NextResponse.json(DEMO_INVESTIGATIONS[id]);
    }

    // Dynamic fallback for any other TXN ID
    return NextResponse.json({
      incident_id: INC-,
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
        gateway_reference: GW-REF-,
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
