package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// PaymentAPI is an HTTP client for the PayRecall backend.
type PaymentAPI struct {
	baseURL    string
	httpClient *http.Client
}

// New creates a PaymentAPI pointed at baseURL (e.g. "http://localhost:8080").
func New(baseURL string) *PaymentAPI {
	return &PaymentAPI{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// --- response types (what the backend actually returns) ---

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

type GatewayTransaction struct {
	GatewayTransactionID   string    `json:"gateway_transaction_id"`
	TransactionID          string    `json:"transaction_id"`
	GatewayName            string    `json:"gateway_name"`
	GatewayStatus          string    `json:"gateway_status"`
	GatewayResponseCode    string    `json:"gateway_response_code"`
	GatewayResponseMessage string    `json:"gateway_response_message"`
	AuthorizationCode      string    `json:"authorization_code"`
	ProcessedAt            time.Time `json:"processed_at"`
}

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

// --- sentinel errors ---

// ErrNotFound is returned when the backend responds with 404.
var ErrNotFound = fmt.Errorf("not found")

// --- API methods ---

// GetTransaction calls GET /api/transactions/{id}.
func (c *PaymentAPI) GetTransaction(ctx context.Context, transactionID string) (*Transaction, error) {
	url := fmt.Sprintf("%s/api/transactions/%s", c.baseURL, transactionID)

	var t Transaction
	if err := c.get(ctx, url, &t); err != nil {
		return nil, err
	}
	return &t, nil
}

// GetGatewayStatus calls GET /api/transactions/{id}/gateway.
func (c *PaymentAPI) GetGatewayStatus(ctx context.Context, transactionID string) (*GatewayTransaction, error) {
	url := fmt.Sprintf("%s/api/transactions/%s/gateway", c.baseURL, transactionID)

	var g GatewayTransaction
	if err := c.get(ctx, url, &g); err != nil {
		return nil, err
	}
	return &g, nil
}

// GetWebhookAttempts calls GET /api/transactions/{id}/webhooks.
func (c *PaymentAPI) GetWebhookAttempts(ctx context.Context, transactionID string) ([]WebhookAttempt, error) {
	url := fmt.Sprintf("%s/api/transactions/%s/webhooks", c.baseURL, transactionID)

	var attempts []WebhookAttempt
	if err := c.get(ctx, url, &attempts); err != nil {
		return nil, err
	}
	return attempts, nil
}

// get performs a GET, decodes the JSON body into dest, and maps HTTP errors.
func (c *PaymentAPI) get(ctx context.Context, url string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http get %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return ErrNotFound
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("backend error: HTTP %d", resp.StatusCode)
	}

	if err := json.NewDecoder(resp.Body).Decode(dest); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}
