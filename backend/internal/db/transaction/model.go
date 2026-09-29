package transaction

import "time"

// Transaction mirrors the transactions table in the database.
type Transaction struct {
	TransactionID  string    `json:"transaction_id"`
	MerchantID     string    `json:"merchant_id"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	PaymentMethod  string    `json:"payment_method"`
	InternalStatus string    `json:"internal_status"`
	RetryCount     int       `json:"retry_count"`
	IdempotencyKey string    `json:"idempotency_key"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
