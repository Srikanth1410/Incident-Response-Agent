"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface Props {
  onSearch: (transactionId: string) => void;
  isLoading: boolean;
  defaultId?: string;
  isNewlyLearned?: boolean;
}

export default function TransactionSearch({
  onSearch,
  isLoading,
  defaultId = "TXN-DEMO-001",
  isNewlyLearned = false,
}: Props) {
  const [transactionId, setTransactionId] = useState(defaultId);

  useEffect(() => {
    if (defaultId) {
      setTransactionId(defaultId);
    }
  }, [defaultId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionId.trim()) {
      onSearch(transactionId.trim());
    }
  };

  const demoScenarios = [
    {
      id: "TXN-DEMO-001",
      label: "Demo A: Baseline",
      desc: "Before Learning (Generic)",
      badge: "DEMO A",
      color: "hover:border-indigo-500",
    },
    {
      id: "TXN-DEMO-002",
      label: "Demo B: After Learning",
      desc: "Recalls INC-DEMO-001",
      badge: "DEMO B",
      color: "hover:border-emerald-500 text-emerald-300",
    },
    {
      id: "TXN-DEMO-003",
      label: "Demo C: Non-Matching",
      desc: "Declined (No Blind Reuse)",
      badge: "DEMO C",
      color: "hover:border-amber-500 text-amber-300",
    },
    {
      id: "TXN-1001",
      label: "TXN-1001",
      desc: "Legacy Live Mismatch",
      badge: "CASE 1",
      color: "hover:border-slate-500",
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label
            htmlFor="txn-input"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1"
          >
            Transaction ID
          </label>
          <p className="text-sm text-slate-300">
            Enter payment transaction identifier to run autonomous multi-tier agent investigation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative">
            <input
              id="txn-input"
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TXN-DEMO-001"
              disabled={isLoading}
              className="bg-slate-950 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-56 uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !transactionId.trim()}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow-md transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Investigating...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Investigate
              </>
            )}
          </button>
        </form>
      </div>

      {/* Preset Demo Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          Judge Demonstration Scenarios:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {demoScenarios.map((demo) => {
            const isSelected = transactionId.toUpperCase() === demo.id;
            return (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  setTransactionId(demo.id);
                  onSearch(demo.id);
                }}
                disabled={isLoading}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-indigo-950/70 border-indigo-500 shadow-sm"
                    : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/60"
                } ${demo.color}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {demo.id}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-900 border border-slate-700 text-slate-400">
                    {demo.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{demo.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
