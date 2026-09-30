"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TransactionSearch from "@/components/TransactionSearch";
import InvestigationTrace from "@/components/InvestigationTrace";
import EvidenceCard from "@/components/EvidenceCard";
import RiskCard from "@/components/RiskCard";
import SimilarIncidents from "@/components/SimilarIncidents";
import PatternInsights from "@/components/PatternInsights";
import DiagnosisCard from "@/components/DiagnosisCard";
import RecommendationCard from "@/components/RecommendationCard";
import ResolutionForm from "@/components/ResolutionForm";
import { investigateTransaction } from "@/lib/api";
import { InvestigationResponse } from "@/types/investigation";
import { Loader2, ShieldCheck, Zap } from "lucide-react";

function InvestigateContent() {
  const searchParams = useSearchParams();
  const initialTxn = searchParams.get("txn") || "TXN-1001";

  const [currentTxnId, setCurrentTxnId] = useState(initialTxn);
  const [data, setData] = useState<InvestigationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const STEPS = [
    "Loading internal transaction ledger...",
    "Checking external payment gateway...",
    "Inspecting webhook delivery attempts...",
    "Searching Hindsight operational memory...",
    "Analyzing historical patterns (areflect)...",
    "Generating diagnosis & remediation plan...",
  ];

  const handleSearch = async (txnId: string) => {
    setCurrentTxnId(txnId);
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 400);

    try {
      const res = await investigateTransaction(txnId);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to investigate";
      setError(msg);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTxn) {
      handleSearch(initialTxn);
    }
  }, [initialTxn]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">
              PayRecall Investigation
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Self-Learning Payment Operations Agent • Multi-tier investigation & Hindsight operational memory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-mono text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Agent Operational
          </span>
        </div>
      </div>

      {/* Transaction Search Box */}
      <TransactionSearch
        onSearch={handleSearch}
        isLoading={loading}
        defaultId={currentTxnId}
      />

      {/* Dynamic Animated Loading State */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              Investigating Payment Incident...
            </h3>
            <p className="text-xs font-mono text-indigo-300 mt-1">
              {STEPS[loadingStep]}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2 pt-2 text-left">
            {STEPS.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                {idx < loadingStep ? (
                  <span className="text-emerald-400 font-bold font-mono">✓</span>
                ) : idx === loadingStep ? (
                  <span className="text-indigo-400 font-bold font-mono animate-pulse">●</span>
                ) : (
                  <span className="text-slate-600 font-bold font-mono">○</span>
                )}
                <span
                  className={
                    idx < loadingStep
                      ? "text-slate-300 line-through opacity-70"
                      : idx === loadingStep
                      ? "text-indigo-200 font-semibold"
                      : "text-slate-500"
                  }
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 text-rose-300 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Investigation Screen Data */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Component 1: Tool & Memory Trace */}
          <InvestigationTrace trace={data.trace} />

          {/* Component 2: Current Evidence & Risk Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EvidenceCard
              transaction={data.transaction}
              gateway={data.gateway}
              webhooks={data.webhooks}
            />
            <RiskCard
              riskLevel={data.risk_level}
              internalStatus={data.transaction?.internal_status}
              gatewayStatus={data.gateway?.gateway_status}
            />
          </div>

          {/* Component 3: Similar Historical Incidents (Hindsight Recall) */}
          <SimilarIncidents memories={data.memories} />

          {/* Component 4: Cross-Incident Intelligence (Hindsight Reflect) */}
          {data.insights && <PatternInsights insights={data.insights} />}

          {/* Component 5: Diagnosis & Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DiagnosisCard diagnosis={data.diagnosis} />
            <RecommendationCard recommendations={data.recommendation} />
          </div>

          {/* Component 6: Human Confirmation & Learning Section */}
          <ResolutionForm
            incidentId={data.incident_id || "INC-101"}
            defaultRootCause={data.insights?.common_pattern || "Webhook state mismatch after gateway lag"}
            defaultAction={data.insights?.successful_action || "Reconcile gateway authorization & update ledger"}
          />
        </div>
      )}
    </div>
  );
}

export default function InvestigatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      }
    >
      <InvestigateContent />
    </Suspense>
  );
}
