"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface Props {
  onSearch: (transactionId: string) => void;
  isLoading: boolean;
  defaultId?: string;
}

export default function TransactionSearch({
  onSearch,
  isLoading,
  defaultId = "TXN-1001",
}: Props) {
  const [transactionId, setTransactionId] = useState(defaultId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionId.trim()) {
      onSearch(transactionId.trim());
    }
  };

  const sampleIds = ["TXN-1001", "TXN-1002", "TXN-1003"];

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
            Enter payment transaction identifier to run multi-tier agent investigation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative">
            <input
              id="txn-input"
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TXN-1001"
              disabled={isLoading}
              className="bg-slate-950 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-52 uppercase"
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

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-400">Quick Demo Scenarios:</span>
        {sampleIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTransactionId(id);
              onSearch(id);
            }}
            disabled={isLoading}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono transition-colors"
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
