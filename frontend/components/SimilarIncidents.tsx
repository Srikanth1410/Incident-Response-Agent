import React from "react";
import { HistoricalIncident } from "@/types/investigation";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  memories: HistoricalIncident[];
}

export default function SimilarIncidents({ memories }: Props) {
  if (!memories || memories.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-sm">
        No similar historical incidents found in Hindsight memory.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Similar Historical Incidents (Hindsight Recall)
          </h3>
        </div>
        <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-mono">
          {memories.length} relevant {memories.length === 1 ? "memory" : "memories"} found
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((incident) => {
          const matchPercent = incident.relevance ? Math.round(incident.relevance * 100) : 92;

          return (
            <div
              key={incident.incident_id}
              className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-bold text-indigo-300">
                    {incident.incident_id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {matchPercent}% relevant
                  </span>
                </div>

                {incident.symptoms && (
                  <div className="text-xs font-mono text-slate-400 mb-3 bg-slate-900 px-2 py-1 rounded inline-block">
                    {incident.symptoms}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                      Root Cause
                    </span>
                    <p className="text-slate-200 mt-0.5">{incident.root_cause}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                      Successful Action
                    </span>
                    <p className="text-emerald-300 font-medium mt-0.5 flex items-start gap-1.5">
                      <span className="text-emerald-400">?</span> {incident.resolution}
                    </p>
                  </div>
                </div>

                {incident.why_relevant && incident.why_relevant.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">
                      Why relevant?
                    </span>
                    <ul className="space-y-1">
                      {incident.why_relevant.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
