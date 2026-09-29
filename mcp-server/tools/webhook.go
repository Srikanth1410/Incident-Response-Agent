package tools

import (
	"context"
	"fmt"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"payrecall/mcp-server/client"
)

// WebhookInput is the schema for the get_webhook_attempts tool.
type WebhookInput struct {
	TransactionID string `json:"transaction_id" jsonschema:"description=The unique transaction identifier to retrieve webhook delivery attempts for"`
}

// WebhookAttemptSummary is a single webhook attempt as returned to the agent.
type WebhookAttemptSummary struct {
	AttemptNumber  int    `json:"attempt_number"`
	HTTPStatus     int    `json:"http_status"`
	WebhookStatus  string `json:"webhook_status"`
	ResponseTimeMs int    `json:"response_time_ms"`
	ErrorMessage   string `json:"error_message"`
}

// WebhookOutput is what the MCP tool returns to the agent.
type WebhookOutput struct {
	TransactionID string                  `json:"transaction_id"`
	Attempts      []WebhookAttemptSummary `json:"attempts"`
}

// GetWebhookAttemptsHandler returns a typed MCP tool handler for webhook attempts.
func GetWebhookAttemptsHandler(api *client.PaymentAPI) func(context.Context, *mcp.CallToolRequest, WebhookInput) (*mcp.CallToolResult, WebhookOutput, error) {
	return func(ctx context.Context, req *mcp.CallToolRequest, input WebhookInput) (*mcp.CallToolResult, WebhookOutput, error) {
		if input.TransactionID == "" {
			return nil, WebhookOutput{}, fmt.Errorf("transaction_id is required")
		}

		attempts, err := api.GetWebhookAttempts(ctx, input.TransactionID)
		if err != nil {
			return nil, WebhookOutput{}, fmt.Errorf("internal error fetching webhook attempts: %w", err)
		}

		summaries := make([]WebhookAttemptSummary, len(attempts))
		for i, a := range attempts {
			summaries[i] = WebhookAttemptSummary{
				AttemptNumber:  a.AttemptNumber,
				HTTPStatus:     a.HTTPStatus,
				WebhookStatus:  a.WebhookStatus,
				ResponseTimeMs: a.ResponseTimeMs,
				ErrorMessage:   a.ErrorMessage,
			}
		}

		return nil, WebhookOutput{
			TransactionID: input.TransactionID,
			Attempts:      summaries,
		}, nil
	}
}
