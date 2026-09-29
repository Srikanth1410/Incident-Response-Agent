package gateway

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrNotFound is returned when no gateway record exists for the transaction.
var ErrNotFound = errors.New("gateway transaction not found")

// Repository queries the gateway_transactions table.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new gateway Repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetByTransactionID fetches the gateway record linked to a transaction_id.
func (r *Repository) GetByTransactionID(ctx context.Context, transactionID string) (*GatewayTransaction, error) {
	query := `
		SELECT
			gateway_transaction_id,
			transaction_id,
			gateway_name,
			gateway_status,
			gateway_response_code,
			gateway_response_message,
			authorization_code,
			processed_at
		FROM gateway_transactions
		WHERE transaction_id = $1`

	g := &GatewayTransaction{}
	err := r.db.QueryRow(ctx, query, transactionID).Scan(
		&g.GatewayTransactionID,
		&g.TransactionID,
		&g.GatewayName,
		&g.GatewayStatus,
		&g.GatewayResponseCode,
		&g.GatewayResponseMessage,
		&g.AuthorizationCode,
		&g.ProcessedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("gateway.Repository.GetByTransactionID: %w", err)
	}
	return g, nil
}
