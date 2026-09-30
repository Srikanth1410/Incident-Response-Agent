import React from "react";
import { MemoryComparison } from "@/types/investigation";
import { ArrowRight, Brain, Sparkles, AlertTriangle, ShieldCheck, Scale } from "lucide-react";

interface Props {
  comparison?: MemoryComparison;
  learningStage?: "BEFORE_LEARNING" | "AFTER_LEARNING" | "NON_MATCHING_REASONING";
}

export default function MemoryComparisonPanel({ comparison, learningStage }: Props) {
  if (!comparison) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-500/30 rounded-xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">
            Why Memory Changed This Answer
          </h3>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 font-mono">
          Judge Insight • Hindsight Intelligence Delta
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Comparing standard stateless LLM output versus PayRecall augmented with persistent Hindsight operational memory:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Without Memory (Stateless) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Without Memory (Stateless LLM)
            </span>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
              Generic Baseline
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Diagnosis</span>
              <p className="text-slate-300 mt-0.5 font-sans leading-relaxed">
                {comparison.without_memory.diagnosis}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Recommended Next Step</span>
              <ul className="mt-1 space-y-1">
                {comparison.without_memory.recommendation.map((step, idx) => (
                  <li key={idx} className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-500">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
              Confidence: {comparison.without_memory.confidence}
            </div>
          </div>
        </div>

        {/* With Hindsight Memory (Organizational Knowledge) */}
        <div className="bg-indigo-950/40 border border-indigo-700/60 rounded-lg p-4 space-y-3 relative overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              With Hindsight Memory
            </span>
            <span className="text-[10px] bg-indigo-900/90 text-indigo-200 px-2 py-0.5 rounded font-mono border border-indigo-700 font-bold">
              PayRecall Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-indigo-300 block font-semibold text-[11px]">Diagnosis</span>
              <p className="text-slate-100 mt-0.5 font-medium leading-relaxed">
                {comparison.with_memory.diagnosis}
              </p>
            </div>

            <div>
              <span className="text-indigo-300 block font-semibold text-[11px]">Historical Evidence</span>
              <p className="text-indigo-200 font-mono mt-0.5 bg-indigo-950/80 px-2 py-1 rounded border border-indigo-800/80 text-[11px]">
                {comparison.with_memory.historical_evidence}
              </p>
            </div>

            <div>
              <span className="text-indigo-300 block font-semibold text-[11px]">Previous Confirmed Fix</span>
              <p className="text-emerald-300 font-medium mt-0.5 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{comparison.with_memory.previous_fix}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-indigo-800/60 flex items-center justify-between text-[11px]">
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {comparison.with_memory.risk}
              </span>
              <span className="text-indigo-300 font-mono text-[10px]">
                {learningStage === "AFTER_LEARNING" ? "✓ Backed by INC-DEMO-001" : "Operational reasoning"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
