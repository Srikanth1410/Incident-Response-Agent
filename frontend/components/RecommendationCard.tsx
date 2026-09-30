import React from "react";
import { CheckSquare } from "lucide-react";

interface Props {
  recommendations: string[];
}

export default function RecommendationCard({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
        <CheckSquare className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
          Recommended Action Plan
        </h3>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <p className="text-xs text-slate-200 leading-normal">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
