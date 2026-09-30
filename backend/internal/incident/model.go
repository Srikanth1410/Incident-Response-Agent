package incident

import "time"

// Incident is the investigation record for a transaction problem.
type Incident struct {
	IncidentID          string     `json:"incident_id"`
	TransactionID       string     `json:"transaction_id"`
	AgentDiagnosis      string     `json:"agent_diagnosis"`
	AgentRiskLevel      string     `json:"agent_risk_level"`
	Recommendation      string     `json:"recommendation"`
	ConfirmedRootCause  string     `json:"confirmed_root_cause"`
	Resolution          string     `json:"resolution"`
	Outcome             string     `json:"outcome"` // SUCCESS | FAILED | OPEN
	OperatorNotes       string     `json:"operator_notes"`
	MemorySaved         bool       `json:"memory_saved"`
	OpenedAt            time.Time  `json:"opened_at"`
	ResolvedAt          *time.Time `json:"resolved_at,omitempty"`
}

// InvestigationAction tracks a single action tried during an incident.
type InvestigationAction struct {
	ActionID          string    `json:"action_id"`
	IncidentID        string    `json:"incident_id"`
	ActionOrder       int       `json:"action_order"`
	ActionType        string    `json:"action_type"`
	ActionDescription string    `json:"action_description"`
	Result            string    `json:"result"` // SUCCESS | FAILED | PENDING
	ActionedAt        time.Time `json:"actioned_at"`
}

// CreateIncidentRequest is the body for POST /api/incidents.
type CreateIncidentRequest struct {
	TransactionID  string `json:"transaction_id"`
	AgentDiagnosis string `json:"agent_diagnosis"`
	AgentRiskLevel string `json:"agent_risk_level"`
	Recommendation string `json:"recommendation"`
}

// ResolveIncidentRequest is the body for PATCH /api/incidents/{id}/resolve.
type ResolveIncidentRequest struct {
	ConfirmedRootCause string                `json:"confirmed_root_cause"`
	Resolution         string                `json:"resolution"`
	Outcome            string                `json:"outcome"`
	OperatorNotes      string                `json:"operator_notes,omitempty"`
	Actions            []ActionInput         `json:"actions,omitempty"`
}

// ActionInput is a single tried-action inside a resolve request.
type ActionInput struct {
	ActionType        string `json:"action_type"`
	ActionDescription string `json:"action_description"`
	Result            string `json:"result"`
}
