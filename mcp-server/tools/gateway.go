package tools

import (
	"context"
	"errors"
	"fmt"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"payrecall/mcp-server/client"
)

// GatewayInput is the schema for the get_gateway_status tool.
type GatewayInput struct {
	TransactionID string `json:"transaction_id" jsonschema:"description=The unique transaction identifier to look up gateway status for"`
}

// GatewayOutput is what the MCP tool returns to the agent.
type GatewayOutput struct {
	GatewayTransactionID   string `json:"gateway_transaction_id"`
	TransactionID          string `json:"transaction_id"`
	GatewayName            string `json:"gateway_name"`
	GatewayStatus          string `json:"gateway_status"`
	GatewayResponseCode    string `json:"gateway_response_code"`
	GatewayResponseMessage string `json:"gateway_response_message"`
	AuthorizationCode      string `json:"authorization_code"`
}

// GetGatewayStatusHandler returns a typed MCP tool handler for gateway status.
func GetGatewayStatusHandler(api *client.PaymentAPI) func(context.Context, *mcp.CallToolRequest, GatewayInput) (*mcp.CallToolResult, GatewayOutput, error) {
	return func(ctx context.Context, req *mcp.CallToolRequest, input GatewayInput) (*mcp.CallToolResult, GatewayOutput, error) {
		if input.TransactionID == "" {
			return nil, GatewayOutput{}, fmt.Errorf("transaction_id is required")
		}

		gw, err := api.GetGatewayStatus(ctx, input.TransactionID)
		if err != nil {
			if errors.Is(err, client.ErrNotFound) {
				return nil, GatewayOutput{}, fmt.Errorf("no gateway record found for transaction %q", input.TransactionID)
			}
			return nil, GatewayOutput{}, fmt.Errorf("internal error fetching gateway status: %w", err)
		}

		out := GatewayOutput{
			GatewayTransactionID:   gw.GatewayTransactionID,
			TransactionID:          gw.TransactionID,
			GatewayName:            gw.GatewayName,
			GatewayStatus:          gw.GatewayStatus,
			GatewayResponseCode:    gw.GatewayResponseCode,
			GatewayResponseMessage: gw.GatewayResponseMessage,
			AuthorizationCode:      gw.AuthorizationCode,
		}
		return nil, out, nil
	}
}
