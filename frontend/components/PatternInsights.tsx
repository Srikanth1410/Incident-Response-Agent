import React from "react";
import { PatternInsights as InsightsType } from "@/types/investigation";
import { BrainCircuit, CheckCircle, XCircle, AlertOctagon } from "lucide-react";

interface Props {
  insights?: InsightsType;
}

export default function PatternInsights({ insights }: Props) {
  if (!insights) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Cross-Incident Intelligence (Hindsight Reflect)
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
          Synthesized Pattern
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.common_pattern && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Most Common Cause
            </span>
            <p className="text-sm font-medium text-slate-200">{insights.common_pattern}</p>
          </div>
        )}

        {insights.successful_action && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Most Successful Action</span>
            </div>
            <p className="text-sm font-medium text-emerald-300">{insights.successful_action}</p>
          </div>
        )}

        {insights.failed_action && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Repeatedly Failed Action</span>
            </div>
            <p className="text-sm font-medium text-rose-300">{insights.failed_action}</p>
          </div>
        )}

        {insights.highest_risk && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Highest Risk Pattern</span>
            </div>
            <p className="text-sm font-medium text-amber-300">{insights.highest_risk}</p>
          </div>
        )}
      </div>

      {insights.summary && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Across historical incidents: </span>
          {insights.summary}
        </div>
      )}
    </div>
  );
}
