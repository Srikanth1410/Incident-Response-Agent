package webhook

import "time"

// WebhookAttempt mirrors the webhook_attempts table.
type WebhookAttempt struct {
	WebhookAttemptID string    `json:"webhook_attempt_id"`
	TransactionID    string    `json:"transaction_id"`
	MerchantID       string    `json:"merchant_id"`
	AttemptNumber    int       `json:"attempt_number"`
	HTTPStatus       int       `json:"http_status"`
	WebhookStatus    string    `json:"webhook_status"`
	ResponseTimeMs   int       `json:"response_time_ms"`
	ErrorMessage     string    `json:"error_message"`
	AttemptedAt      time.Time `json:"attempted_at"`
}
