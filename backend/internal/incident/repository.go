package incident

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrNotFound is returned when an incident does not exist.
var ErrNotFound = errors.New("incident not found")

// Repository queries the incidents and investigation_actions tables.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new incident Repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create inserts a new incident opened by the agent after an investigation.
func (r *Repository) Create(ctx context.Context, req CreateIncidentRequest, incidentID string) (*Incident, error) {
	query := `
		INSERT INTO incidents (
			incident_id, transaction_id,
			agent_diagnosis, agent_risk_level, recommendation,
			outcome
		) VALUES ($1, $2, $3, $4, $5, 'OPEN')
		RETURNING
			incident_id, transaction_id,
			agent_diagnosis, agent_risk_level, recommendation,
			confirmed_root_cause, resolution, outcome,
			operator_notes, memory_saved, opened_at, resolved_at`

	inc := &Incident{}
	err := r.db.QueryRow(ctx, query,
		incidentID,
		req.TransactionID,
		req.AgentDiagnosis,
		req.AgentRiskLevel,
		req.Recommendation,
	).Scan(
		&inc.IncidentID, &inc.TransactionID,
		&inc.AgentDiagnosis, &inc.AgentRiskLevel, &inc.Recommendation,
		&inc.ConfirmedRootCause, &inc.Resolution, &inc.Outcome,
		&inc.OperatorNotes, &inc.MemorySaved, &inc.OpenedAt, &inc.ResolvedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("incident.Repository.Create: %w", err)
	}
	return inc, nil
}

// GetByID fetches an incident by its ID.
func (r *Repository) GetByID(ctx context.Context, incidentID string) (*Incident, error) {
	query := `
		SELECT
			incident_id, transaction_id,
			agent_diagnosis, agent_risk_level, recommendation,
			confirmed_root_cause, resolution, outcome,
			operator_notes, memory_saved, opened_at, resolved_at
		FROM incidents
		WHERE incident_id = $1`

	inc := &Incident{}
	err := r.db.QueryRow(ctx, query, incidentID).Scan(
		&inc.IncidentID, &inc.TransactionID,
		&inc.AgentDiagnosis, &inc.AgentRiskLevel, &inc.Recommendation,
		&inc.ConfirmedRootCause, &inc.Resolution, &inc.Outcome,
		&inc.OperatorNotes, &inc.MemorySaved, &inc.OpenedAt, &inc.ResolvedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("incident.Repository.GetByID: %w", err)
	}
	return inc, nil
}

// Resolve updates an incident with the operator-confirmed resolution and
// stores each investigation action taken (including failed ones).
func (r *Repository) Resolve(ctx context.Context, incidentID string, req ResolveIncidentRequest) (*Incident, error) {
	now := time.Now()

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Update the incident row.
	updateQ := `
		UPDATE incidents SET
			confirmed_root_cause = $1,
			resolution           = $2,
			outcome              = $3,
			operator_notes       = $4,
			resolved_at          = $5
		WHERE incident_id = $6
		RETURNING
			incident_id, transaction_id,
			agent_diagnosis, agent_risk_level, recommendation,
			confirmed_root_cause, resolution, outcome,
			operator_notes, memory_saved, opened_at, resolved_at`

	inc := &Incident{}
	err = tx.QueryRow(ctx, updateQ,
		req.ConfirmedRootCause,
		req.Resolution,
		req.Outcome,
		req.OperatorNotes,
		now,
		incidentID,
	).Scan(
		&inc.IncidentID, &inc.TransactionID,
		&inc.AgentDiagnosis, &inc.AgentRiskLevel, &inc.Recommendation,
		&inc.ConfirmedRootCause, &inc.Resolution, &inc.Outcome,
		&inc.OperatorNotes, &inc.MemorySaved, &inc.OpenedAt, &inc.ResolvedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("incident.Repository.Resolve update: %w", err)
	}

	// Insert investigation actions (including failed ones).
	actionQ := `
		INSERT INTO investigation_actions
			(incident_id, action_order, action_type, action_description, result)
		VALUES ($1, $2, $3, $4, $5)`

	for i, a := range req.Actions {
		if _, err := tx.Exec(ctx, actionQ,
			incidentID, i+1, a.ActionType, a.ActionDescription, a.Result,
		); err != nil {
			return nil, fmt.Errorf("insert action %d: %w", i+1, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}
	return inc, nil
}

// MarkMemorySaved sets memory_saved = true after Hindsight retain succeeds.
func (r *Repository) MarkMemorySaved(ctx context.Context, incidentID string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE incidents SET memory_saved = TRUE WHERE incident_id = $1`,
		incidentID,
	)
	return err
}

// ListActions returns all investigation actions for an incident, ordered.
func (r *Repository) ListActions(ctx context.Context, incidentID string) ([]InvestigationAction, error) {
	query := `
		SELECT action_id, incident_id, action_order, action_type,
		       action_description, result, actioned_at
		FROM investigation_actions
		WHERE incident_id = $1
		ORDER BY action_order`

	rows, err := r.db.Query(ctx, query, incidentID)
	if err != nil {
		return nil, fmt.Errorf("list actions: %w", err)
	}
	defer rows.Close()

	var actions []InvestigationAction
	for rows.Next() {
		var a InvestigationAction
		if err := rows.Scan(
			&a.ActionID, &a.IncidentID, &a.ActionOrder, &a.ActionType,
			&a.ActionDescription, &a.Result, &a.ActionedAt,
		); err != nil {
			return nil, err
		}
		actions = append(actions, a)
	}
	return actions, rows.Err()
}
