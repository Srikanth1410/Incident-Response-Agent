"use client";

import React, { useState, useEffect } from "react";
import { resolveIncident } from "@/lib/api";
import {
  GraduationCap,
  CheckCircle2,
  Loader2,
  Sparkles,
  Database,
  Save,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

interface Props {
  incidentId: string;
  defaultRootCause?: string;
  defaultAction?: string;
  onSuccess?: (incidentId: string) => void;
  onNextDemo?: (txnId: string) => void;
}

export default function ResolutionForm({
  incidentId,
  defaultRootCause = "Webhook timeout prevented state reconciliation",
  defaultAction = "Blocked retry and reconciled gateway state",
  onSuccess,
  onNextDemo,
}: Props) {
  const [rootCause, setRootCause] = useState(defaultRootCause);
  const [actionTaken, setActionTaken] = useState(defaultAction);
  const [outcome, setOutcome] = useState<"SUCCESS" | "FAILED" | "PARTIAL">("SUCCESS");
  const [notes, setNotes] = useState(
    "Verified gateway authorization in Stripe dashboard. Blocked retry queue and reconciled internal transaction state to AUTHORIZED."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setRootCause(defaultRootCause);
    setActionTaken(defaultAction);
    setIsResolved(false);
  }, [defaultRootCause, defaultAction, incidentId]);

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
      if (onSuccess) {
        onSuccess(incidentId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record resolution";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsResolved(false);
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
                Incident Resolved & Experience Retained
              </h3>
              <span className="text-xs bg-emerald-900 text-emerald-300 px-2.5 py-0.5 rounded font-mono font-bold">
                {incidentId}
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Your confirmed operational resolution has been recorded and retained into PayRecall&apos;s Hindsight memory bank.
            </p>

            <div className="space-y-2 text-xs text-emerald-300 font-mono bg-slate-950/80 p-4 rounded-lg border border-emerald-900/80 max-w-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">✓ Incident resolved</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Save className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">✓ Structured record saved to database</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">✓ Experience retained in Hindsight</span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-indigo-950/60 border border-indigo-700/80 rounded-lg max-w-xl">
              <p className="text-xs text-indigo-200 flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>PayRecall has learned this resolution.</strong> It can now use this experience to triage future investigations of similar transactions.
                </span>
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {onNextDemo && (
                <button
                  type="button"
                  onClick={() => onNextDemo("TXN-DEMO-002")}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-xs shadow-lg shadow-indigo-600/30 transition-all hover:translate-x-0.5"
                >
                  <span>Test Next: TXN-DEMO-002 (See Learned Memory in Action)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-2 rounded-lg bg-slate-900 border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Update resolution notes
              </button>
            </div>
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
            Resolve Incident & Teach PayRecall
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Incident ID: {incidentId}</span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Human-in-the-loop verification. Confirming the true root cause and action taken updates PostgreSQL and retains the experience in Hindsight so PayRecall becomes continuously smarter.
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
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Action Taken
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
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
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="SUCCESS">SUCCESS</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operational details for future recall..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
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
