package gateway

import "time"

// GatewayTransaction mirrors the gateway_transactions table.
type GatewayTransaction struct {
	GatewayTransactionID  string    `json:"gateway_transaction_id"`
	TransactionID         string    `json:"transaction_id"`
	GatewayName           string    `json:"gateway_name"`
	GatewayStatus         string    `json:"gateway_status"`
	GatewayResponseCode   string    `json:"gateway_response_code"`
	GatewayResponseMessage string   `json:"gateway_response_message"`
	AuthorizationCode     string    `json:"authorization_code"`
	ProcessedAt           time.Time `json:"processed_at"`
}
