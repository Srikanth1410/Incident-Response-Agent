import { InvestigationResponse, ResolutionPayload, ResolutionResponse } from "@/types/investigation";

export async function investigateTransaction(transactionId: string): Promise<InvestigationResponse> {
  const res = await fetch("/api/agent/investigate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction_id: transactionId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || Investigation failed with status );
  }

  return res.json();
}

export async function resolveIncident(
  incidentId: string,
  payload: ResolutionPayload
): Promise<ResolutionResponse> {
  const res = await fetch(/api/incidents//resolve, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || Resolution failed with status );
  }

  return res.json();
}
