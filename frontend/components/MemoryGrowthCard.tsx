import React from "react";
import { MemoryGrowthStats } from "@/types/investigation";
import { Brain, ArrowUpRight, TrendingUp, Sparkles, Database } from "lucide-react";

interface Props {
  stats?: MemoryGrowthStats;
  isNewlyLearned?: boolean;
}

export default function MemoryGrowthCard({ stats, isNewlyLearned }: Props) {
  const currentCount = stats?.resolved_experiences ?? (isNewlyLearned ? 19 : 18);
  const prevCount = 18;
  const hasGrowth = isNewlyLearned || stats?.has_new_growth || currentCount > prevCount;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            PayRecall Memory Bank Growth
          </h3>
        </div>
        {hasGrowth && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono animate-pulse">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            +1 New Memory Retained
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Resolved Experiences with 18 -> 19 visual impact */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Resolved Experiences
          </span>
          <div className="flex items-baseline gap-2">
            {hasGrowth ? (
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-lg font-semibold text-slate-500 line-through">18</span>
                <span className="text-xs text-indigo-400">→</span>
                <span className="text-2xl font-extrabold text-emerald-400 animate-bounce">19</span>
              </div>
            ) : (
              <span className="text-2xl font-extrabold text-slate-100 font-mono">
                {currentCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {hasGrowth ? "Incremented from INC-DEMO-001" : "Organizational history"}
          </span>
        </div>

        {/* Successful Resolutions */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Successful Resolutions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-300 font-mono">
              {stats?.successful_resolutions ?? (hasGrowth ? 14 : 13)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {hasGrowth ? "100% resolution success" : "Remediated ledger states"}
          </span>
        </div>

        {/* Failed Actions Learned */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Failed Actions Learned
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-300 font-mono">
              {stats?.failed_actions_learned ?? 9}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Blocked from repeating (e.g. blind retry)
          </span>
        </div>

        {/* Recurring Patterns */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Recurring Patterns
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-300 font-mono">
              {stats?.recurring_patterns ?? 6}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Synthesized via Hindsight reflect()
          </span>
        </div>
      </div>
    </div>
  );
}
