"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

export default function InvestigatePage() {
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
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

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
    handleSearch("TXN-1001");
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Payment Incident Investigation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Autonomous multi-tier triage with Hindsight recall, pattern reflection, and human-in-the-loop confirmation.
        </p>
      </div>

      <TransactionSearch onSearch={handleSearch} isLoading={loading} defaultId="TXN-1001" />

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

          <div className="max-w-md mx-auto space-y-1.5 pt-2 text-left">
            {STEPS.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {idx < loadingStep ? (
                  <span className="text-emerald-400 font-bold">?</span>
                ) : idx === loadingStep ? (
                  <span className="text-indigo-400 animate-pulse font-bold">?</span>
                ) : (
                  <span className="text-slate-600">?</span>
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

      {error && !loading && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 text-rose-300 text-sm rounded-xl">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <InvestigationTrace trace={data.trace} />

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

          <SimilarIncidents memories={data.memories} />

          {data.insights && <PatternInsights insights={data.insights} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DiagnosisCard diagnosis={data.diagnosis} />
            <RecommendationCard recommendations={data.recommendation} />
          </div>

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
