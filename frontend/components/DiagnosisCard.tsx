import React from "react";
import { Stethoscope } from "lucide-react";

interface Props {
  diagnosis: string;
}

export default function DiagnosisCard({ diagnosis }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <Stethoscope className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
          Agent Diagnosis
        </h3>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed font-sans">{diagnosis}</p>
    </div>
  );
}
