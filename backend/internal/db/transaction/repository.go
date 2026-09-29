package transaction

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrNotFound is returned when a transaction does not exist.
var ErrNotFound = errors.New("transaction not found")

// Repository queries the transactions table.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new transaction Repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetByID fetches a single transaction by its transaction_id.
func (r *Repository) GetByID(ctx context.Context, transactionID string) (*Transaction, error) {
	query := `
		SELECT
			transaction_id,
			merchant_id,
			amount,
			currency,
			payment_method,
			internal_status,
			retry_count,
			idempotency_key,
			created_at,
			updated_at
		FROM transactions
		WHERE transaction_id = $1`

	t := &Transaction{}
	err := r.db.QueryRow(ctx, query, transactionID).Scan(
		&t.TransactionID,
		&t.MerchantID,
		&t.Amount,
		&t.Currency,
		&t.PaymentMethod,
		&t.InternalStatus,
		&t.RetryCount,
		&t.IdempotencyKey,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("transaction.Repository.GetByID: %w", err)
	}
	return t, nil
}
