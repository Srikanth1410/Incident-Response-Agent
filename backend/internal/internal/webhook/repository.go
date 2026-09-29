package webhook

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository queries the webhook_attempts table.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new webhook Repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ListByTransactionID returns all webhook attempts for a given transaction,
// ordered by attempt_number ascending.
func (r *Repository) ListByTransactionID(ctx context.Context, transactionID string) ([]*WebhookAttempt, error) {
	query := `
		SELECT
			webhook_attempt_id,
			transaction_id,
			merchant_id,
			attempt_number,
			http_status,
			webhook_status,
			response_time_ms,
			error_message,
			attempted_at
		FROM webhook_attempts
		WHERE transaction_id = $1
		ORDER BY attempt_number`

	rows, err := r.db.Query(ctx, query, transactionID)
	if err != nil {
		return nil, fmt.Errorf("webhook.Repository.ListByTransactionID: %w", err)
	}
	defer rows.Close()

	var attempts []*WebhookAttempt
	for rows.Next() {
		w := &WebhookAttempt{}
		if err := rows.Scan(
			&w.WebhookAttemptID,
			&w.TransactionID,
			&w.MerchantID,
			&w.AttemptNumber,
			&w.HTTPStatus,
			&w.WebhookStatus,
			&w.ResponseTimeMs,
			&w.ErrorMessage,
			&w.AttemptedAt,
		); err != nil {
			return nil, fmt.Errorf("webhook.Repository.ListByTransactionID scan: %w", err)
		}
		attempts = append(attempts, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("webhook.Repository.ListByTransactionID rows: %w", err)
	}

	// Return an empty slice (not nil) so JSON encodes as [] not null.
	if attempts == nil {
		attempts = []*WebhookAttempt{}
	}
	return attempts, nil
}
