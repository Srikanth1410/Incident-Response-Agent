import Link from "next/link";
import { ShieldCheck, Search, Database, ArrowRight, Zap, RefreshCw } from "lucide-react";

export default function Home() {
  const quickMetrics = [
    { label: "Active Agent Mode", value: "Autonomous ReAct + Memory" },
    { label: "Memory Retention", value: "Hindsight aretain() Active" },
    { label: "Cross-Incident Reflection", value: "Hindsight areflect() Enabled" },
    { label: "Backend Integration", value: "Go MCP + PostgreSQL" },
  ];

  const demoScenarios = [
    {
      id: "TXN-1001",
      title: "Duplicate-Payment Risk (Mismatch)",
      tag: "HIGH RISK",
      tagColor: "bg-rose-950 text-rose-300 border-rose-800",
      desc: "Internal status is FAILED, but external payment gateway is AUTHORIZED after webhook timeout.",
    },
    {
      id: "TXN-1002",
      title: "Clean Gateway Decline",
      tag: "LOW RISK",
      tagColor: "bg-emerald-950 text-emerald-300 border-emerald-800",
      desc: "Both internal platform and gateway report DECLINED (insufficient funds). No ledger mismatch.",
    },
    {
      id: "TXN-1003",
      title: "Stuck Pending with 500 Webhook",
      tag: "MEDIUM RISK",
      tagColor: "bg-amber-950 text-amber-300 border-amber-800",
      desc: "Gateway authorized ₹89,000, but transaction stuck PENDING due to merchant HTTP 500 crashes.",
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-4">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-xs font-mono text-indigo-300">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          Autonomous Self-Learning Payment Operations
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
          PayRecall
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">
          Triages payment discrepancies in real-time, explains why similar incidents occurred using
          Hindsight memory, blocks duplicate-payment risks, and retains confirmed resolutions to become smarter over time.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/investigate"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Search className="w-4 h-4" />
            Launch Live Investigation
          </Link>
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium px-6 py-3 rounded-xl text-sm transition-colors"
          >
            <Database className="w-4 h-4" />
            View Agent Memory Bank
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickMetrics.map((m, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              {m.label}
            </span>
            <span className="text-sm font-semibold text-slate-200">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Demo Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Judge Demonstration Scenarios
          </h2>
          <span className="text-xs text-slate-400">Click any card to inspect with agent</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoScenarios.map((demo) => (
            <Link
              key={demo.id}
              href={`/investigate?txn=${demo.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-600/60 p-5 rounded-xl transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-indigo-300">{demo.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${demo.tagColor}`}>
                    {demo.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {demo.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{demo.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
                <span>Run Agent Triage</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
