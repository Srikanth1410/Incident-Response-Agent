import React from "react";
import { ArrowRight, CheckCircle2, ChevronRight, Layers } from "lucide-react";

interface Props {
  currentTxnId?: string;
  isResolved?: boolean;
}

export default function MemoryTimeline({ currentTxnId = "TXN-DEMO-001", isResolved = false }: Props) {
  const steps = [
    { label: "Current Incident", sub: currentTxnId, status: "done" },
    { label: "MCP Investigation", sub: "Go Gateway / DB", status: "done" },
    { label: "Memories Recalled", sub: "Hindsight arecall()", status: "done" },
    { label: "Pattern Identified", sub: "Hindsight areflect()", status: "done" },
    { label: "Recommendation", sub: "Actionable Plan", status: "done" },
    { label: "Human Confirmation", sub: isResolved ? "Confirmed" : "HITL Input", status: isResolved ? "done" : "active" },
    { label: "New Memory Retained", sub: isResolved ? "aretain() Saved" : "Awaiting Confirm", status: isResolved ? "done" : "pending" },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            PayRecall Memory & Decision Pipeline
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Incident Lifecycle
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border text-center flex flex-col justify-between transition-all ${
              step.status === "done"
                ? "bg-slate-950 border-slate-800"
                : step.status === "active"
                ? "bg-indigo-950/40 border-indigo-600 shadow-md shadow-indigo-600/10"
                : "bg-slate-950/30 border-slate-850 opacity-60"
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400 mb-1">
              <span>Step {idx + 1}</span>
              {step.status === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-xs font-semibold text-slate-100 mb-0.5">
              {step.label}
            </div>
            <div className="text-[10px] text-indigo-300 font-mono">
              {step.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
