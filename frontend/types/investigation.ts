export interface Transaction {
  transaction_id: string;
  amount: number;
  currency: string;
  internal_status: string;
  merchant_id?: string;
  customer_id?: string;
  retry_count?: number;
  created_at?: string;
}

export interface Gateway {
  gateway_status: string;
  gateway_reference?: string;
  amount?: number;
  currency?: string;
  response_code?: string;
  authorized_at?: string;
}

export interface WebhookAttempt {
  attempt_number?: number;
  status: string;
  webhook_status?: string;
  http_status?: number;
  error_message?: string;
  timestamp?: string;
}

export interface HistoricalIncident {
  incident_id: string;
  relevance?: number;
  symptoms?: string;
  root_cause: string;
  resolution: string;
  outcome?: string;
  why_relevant?: string[];
}

export interface PatternInsights {
  common_pattern?: string;
  successful_action?: string;
  failed_action?: string;
  highest_risk?: string;
  summary?: string;
}

export interface InvestigationResponse {
  incident_id?: string;
  transaction: Transaction;
  gateway: Gateway;
  webhooks: WebhookAttempt[];
  trace: string[];
  memories: HistoricalIncident[];
  insights?: PatternInsights;
  diagnosis: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string[];
}

export interface ResolutionPayload {
  confirmed_root_cause: string;
  action_taken: string;
  outcome: "SUCCESS" | "FAILED" | "PARTIAL";
  notes?: string;
}

export interface ResolutionResponse {
  success: boolean;
  message: string;
  incident_id: string;
  memory_retained: boolean;
}
