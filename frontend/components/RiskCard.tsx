import React from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  internalStatus?: string;
  gatewayStatus?: string;
}

export default function RiskCard({ riskLevel, internalStatus, gatewayStatus }: Props) {
  const isHigh = riskLevel === "HIGH";
  const isMedium = riskLevel === "MEDIUM";

  const getRiskStyles = () => {
    if (isHigh) {
      return {
        bg: "bg-rose-950/40 border-rose-800 text-rose-300",
        badge: "bg-rose-900/60 text-rose-200 border-rose-700",
        icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
        title: "Duplicate-Payment Risk",
        desc: "CRITICAL: Transaction is marked FAILED internally while external gateway has confirmed funds authorization.",
      };
    }
    if (isMedium) {
      return {
        bg: "bg-amber-950/40 border-amber-800 text-amber-300",
        badge: "bg-amber-900/60 text-amber-200 border-amber-700",
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        title: "Fulfillment Delay Risk",
        desc: "Funds held at gateway, but downstream merchant order is awaiting webhook confirmation.",
      };
    }
    return {
      bg: "bg-emerald-950/40 border-emerald-800 text-emerald-300",
      badge: "bg-emerald-900/60 text-emerald-200 border-emerald-700",
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      title: "Consistent State (Low Risk)",
      desc: "Internal status and gateway status are consistent. No immediate duplicate risk.",
    };
  };

  const style = getRiskStyles();

  return (
    <div className={ounded-xl border p-5 shadow-lg flex flex-col justify-between }>
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            System Risk Assessment
          </span>
          <span className={	ext-xs px-2.5 py-0.5 rounded font-mono font-bold border }>
            {riskLevel} RISK
          </span>
        </div>

        <div className="flex items-start gap-4 my-2">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            {style.icon}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-100">{style.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{style.desc}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span>State Evaluation:</span>
        <span className="font-mono text-slate-200">
          {internalStatus || "N/A"} ? {gatewayStatus || "N/A"}
        </span>
      </div>
    </div>
  );
}
