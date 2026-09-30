import React from "react";
import { Transaction, Gateway, WebhookAttempt } from "@/types/investigation";

interface Props {
  transaction: Transaction;
  gateway: Gateway;
  webhooks: WebhookAttempt[];
}

export default function EvidenceCard({ transaction, gateway, webhooks }: Props) {
  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "FAILED" || s === "TIMEOUT") {
      return "bg-rose-950 text-rose-300 border-rose-800";
    }
    if (s === "AUTHORIZED" || s === "SUCCESS" || s === "DELIVERED") {
      return "bg-emerald-950 text-emerald-300 border-emerald-800";
    }
    if (s === "PENDING") {
      return "bg-amber-950 text-amber-300 border-amber-800";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const latestWebhook = webhooks && webhooks.length > 0 ? webhooks[webhooks.length - 1] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Current Evidence
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            TXN: {transaction.transaction_id}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Amount
            </span>
            <span className="text-base font-bold text-slate-100">
              {transaction.currency === "INR" ? "?" : "$"}
              {transaction.amount?.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Retries
            </span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {transaction.retry_count ?? 0}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400">Internal Status</span>
            <span
              className={	ext-xs px-2.5 py-0.5 rounded font-mono font-semibold border }
            >
              {transaction.internal_status}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400">Gateway Status</span>
            <span
              className={	ext-xs px-2.5 py-0.5 rounded font-mono font-semibold border }
            >
              {gateway.gateway_status}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-slate-400">Webhook Attempt</span>
            <span
              className={	ext-xs px-2.5 py-0.5 rounded font-mono font-semibold border }
            >
              {latestWebhook?.status || latestWebhook?.webhook_status || "NONE"}
            </span>
          </div>
        </div>
      </div>

      {gateway.gateway_reference && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Gateway Ref:</span>
          <span className="font-mono text-slate-300">{gateway.gateway_reference}</span>
        </div>
      )}
    </div>
  );
}
