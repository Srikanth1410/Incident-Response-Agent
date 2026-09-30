"use client";

import React from "react";
import { Database, BrainCircuit, CheckCircle2, AlertOctagon, TrendingUp } from "lucide-react";

export default function InsightsPage() {
  const stats = [
    { label: "Incidents Learned", value: "23", desc: "Stored in Hindsight bank" },
    { label: "Successful Resolutions", value: "18", desc: "Remediated without duplicate charge" },
    { label: "Failed Actions Remembered", value: "11", desc: "Blocked from repeating" },
    { label: "Common Patterns Identified", value: "7", desc: "Synthesized via areflect()" },
  ];

  const patterns = [
    {
      id: "1",
      pattern: "FAILED + AUTHORIZED + TIMEOUT",
      observed: "7 incidents",
      risk: "HIGH (Duplicate Payment)",
      successfulAction: "Gateway reconciliation before retry queue fires",
      failedAction: "Blind service restart or automated retry worker",
      lesson:
        "External payment gateway successfully captures funds while internal platform times out. Reconcile external authorization state first before permitting any retry.",
    },
    {
      id: "2",
      pattern: "PENDING + AUTHORIZED + HTTP 500",
      observed: "4 incidents",
      risk: "MEDIUM (Order Fulfillment Blocked)",
      successfulAction: "Webhook retry with exponential backoff after receiver recovers",
      failedAction: "Premature cancellation / chargeback request",
      lesson:
        "Merchant webhook endpoint crashed under burst traffic. Do not void authorized gateway payment; replay webhook once health check is 200 OK.",
    },
    {
      id: "3",
      pattern: "FAILED + DECLINED + SUCCESS",
      observed: "9 incidents",
      risk: "LOW (Normal Bank Decline)",
      successfulAction: "Prompt user for alternate card/UPI without retrying identical card",
      failedAction: "Immediate automatic retry on same card number",
      lesson:
        "Legitimate insufficient funds or bank limit decline. No ledger desync exists.",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-slate-100">
            PayRecall Operational Memory & Cross-Incident Intelligence
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Synthesized across retained payment incident resolutions via Hindsight <code>areflect()</code>.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg"
          >
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              {s.label}
            </span>
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {s.value}
            </span>
            <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Cross-Incident Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Synthesized Operational Patterns (Hindsight Reflect)
            </h2>
          </div>
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono">
            areflect(budget=&quot;mid&quot;)
          </span>
        </div>

        <div className="space-y-4">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                    #{p.id}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100">
                    {p.pattern}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-mono">Observed: {p.observed}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                    {p.risk}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <span className="text-emerald-400 font-semibold block mb-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Most Successful Action
                  </span>
                  <span className="text-slate-200">{p.successfulAction}</span>
                </div>

                <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
                  <span className="text-rose-400 font-semibold block mb-0.5 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" /> Repeatedly Failed Action
                  </span>
                  <span className="text-slate-200">{p.failedAction}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-1 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Operational Rule: </strong>
                  {p.lesson}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
