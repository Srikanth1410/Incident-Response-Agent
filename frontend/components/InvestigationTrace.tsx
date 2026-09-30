import React from "react";
import { CheckCircle2, Circle, Clock, Wrench, BrainCircuit } from "lucide-react";

interface Props {
  trace: string[];
  isLoading?: boolean;
}

const TRACE_STEPS = [
  {
    id: "get_transaction",
    label: "get_transaction",
    desc: "Internal ledger loaded",
    detail: "✓ completed",
    type: "tool",
  },
  {
    id: "get_gateway_status",
    label: "get_gateway_status",
    desc: "External payment gateway checked",
    detail: "✓ completed",
    type: "tool",
  },
  {
    id: "get_webhook_attempts",
    label: "get_webhook_attempts",
    desc: "Webhook delivery history inspected",
    detail: "✓ completed",
    type: "tool",
  },
  {
    id: "hindsight_recall",
    label: "Hindsight recall",
    desc: "Similar operational memories retrieved",
    detail: "✓ memories found",
    type: "memory",
  },
  {
    id: "hindsight_reflect",
    label: "Hindsight reflect",
    desc: "Cross-incident organizational patterns analyzed",
    detail: "✓ historical pattern generated",
    type: "memory",
  },
];

export default function InvestigationTrace({ trace, isLoading }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Agent Investigation Trace
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
          5 / 5 Steps Executed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {TRACE_STEPS.map((step, idx) => {
          const isDone = trace.includes(step.id);
          const isPending = isLoading && !isDone;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                isDone
                  ? "bg-slate-950 border-slate-800"
                  : isPending
                  ? "bg-indigo-950/20 border-indigo-800 animate-pulse"
                  : "bg-slate-950/40 border-slate-850 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">
                    #{idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isPending ? (
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>

                <div className="text-xs font-mono font-bold text-slate-100 mb-1">
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  {step.desc}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80">
                {isDone ? (
                  <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                    {step.detail}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500">
                    pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
