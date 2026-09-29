package tools

import (
	"context"
	"errors"
	"fmt"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"payrecall/mcp-server/client"
)

// TransactionInput is the schema the LLM must supply when calling get_transaction.
type TransactionInput struct {
	TransactionID string `json:"transaction_id" jsonschema:"description=The unique transaction identifier, e.g. TXN-1001"`
}

// TransactionOutput is what the MCP tool returns to the agent.
type TransactionOutput struct {
	TransactionID  string  `json:"transaction_id"`
	MerchantID     string  `json:"merchant_id"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	PaymentMethod  string  `json:"payment_method"`
	InternalStatus string  `json:"internal_status"`
	RetryCount     int     `json:"retry_count"`
	IdempotencyKey string  `json:"idempotency_key"`
}

// GetTransactionHandler returns a typed MCP tool handler backed by the payment API.
func GetTransactionHandler(api *client.PaymentAPI) func(context.Context, *mcp.CallToolRequest, TransactionInput) (*mcp.CallToolResult, TransactionOutput, error) {
	return func(ctx context.Context, req *mcp.CallToolRequest, input TransactionInput) (*mcp.CallToolResult, TransactionOutput, error) {
		if input.TransactionID == "" {
			return nil, TransactionOutput{}, fmt.Errorf("transaction_id is required")
		}

		txn, err := api.GetTransaction(ctx, input.TransactionID)
		if err != nil {
			if errors.Is(err, client.ErrNotFound) {
				return nil, TransactionOutput{}, fmt.Errorf("transaction %q not found", input.TransactionID)
			}
			return nil, TransactionOutput{}, fmt.Errorf("internal error fetching transaction: %w", err)
		}

		out := TransactionOutput{
			TransactionID:  txn.TransactionID,
			MerchantID:     txn.MerchantID,
			Amount:         txn.Amount,
			Currency:       txn.Currency,
			PaymentMethod:  txn.PaymentMethod,
			InternalStatus: txn.InternalStatus,
			RetryCount:     txn.RetryCount,
			IdempotencyKey: txn.IdempotencyKey,
		}
		return nil, out, nil
	}
}
