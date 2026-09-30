import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Props {
  trace: string[];
  isLoading?: boolean;
}

const TRACE_STEPS = [
  { id: "get_transaction", label: "get_transaction", desc: "Internal transaction ledger loaded" },
  { id: "get_gateway_status", label: "get_gateway_status", desc: "External payment gateway checked" },
  { id: "get_webhook_attempts", label: "get_webhook_attempts", desc: "Webhook delivery history inspected" },
  { id: "hindsight_recall", label: "Hindsight recall", desc: "Similar operational memories retrieved" },
  { id: "hindsight_reflect", label: "Hindsight reflect", desc: "Cross-incident organizational patterns analyzed" },
];

export default function InvestigationTrace({ trace, isLoading }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Agent Investigation Trace
        </h3>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
          LLM Tool & Memory Execution
        </span>
      </div>

      <div className="space-y-3">
        {TRACE_STEPS.map((step, idx) => {
          const isDone = trace.includes(step.id);
          const isPending = isLoading && !isDone;

          return (
            <div
              key={step.id}
              className={lex items-start gap-3 p-2.5 rounded-lg border transition-all }
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isPending ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {idx + 1}. {step.label}
                  </span>
                  {isDone && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                      ? completed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
