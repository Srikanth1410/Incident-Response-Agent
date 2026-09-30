"use client";

import React, { useState } from "react";
import { resolveIncident } from "@/lib/api";
import { GraduationCap, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface Props {
  incidentId: string;
  defaultRootCause?: string;
  defaultAction?: string;
}

export default function ResolutionForm({
  incidentId,
  defaultRootCause = "Webhook state mismatch after endpoint gateway lag",
  defaultAction = "Reconcile gateway authorization & update ledger",
}: Props) {
  const [rootCause, setRootCause] = useState(defaultRootCause);
  const [actionTaken, setActionTaken] = useState(defaultAction);
  const [outcome, setOutcome] = useState<"SUCCESS" | "FAILED" | "PARTIAL">("SUCCESS");
  const [notes, setNotes] = useState("Verified gateway authorization in dashboard. Marked transaction AUTHORIZED.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await resolveIncident(incidentId, {
        confirmed_root_cause: rootCause,
        action_taken: actionTaken,
        outcome,
        notes,
      });
      setIsResolved(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record resolution";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResolved) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-6 shadow-xl animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700 text-emerald-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-emerald-200">
                Incident Resolved & Learned
              </h3>
              <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-mono">
                {incidentId}
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              This confirmed operational resolution has been recorded in PostgreSQL and retained into Hindsight memory.
            </p>

            <div className="space-y-1.5 text-xs text-emerald-300 font-mono bg-slate-950/70 p-3 rounded-lg border border-emerald-900/60">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">?</span>
                <span>Incident marked resolved in system</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">?</span>
                <span>Structured record saved to database</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">?</span>
                <span>Experience retained in Hindsight memory bank</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 italic flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              PayRecall will now use this confirmed resolution during future investigations of similar transactions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Human Confirmation (Human-in-the-Loop)
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Incident: {incidentId}</span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Validate the actual root cause and action taken. Confirming will teach PayRecall so the agent becomes continuously smarter.
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleResolve} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Confirmed Root Cause
            </label>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Action Taken (Resolution)
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as "SUCCESS" | "FAILED" | "PARTIAL")}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="SUCCESS">SUCCESS</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Operator Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operational details for future recall..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-xs shadow-md transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Retaining in Hindsight...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Confirm Resolution & Teach PayRecall
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
