package main

import (
	"context"
	"log"
	"os"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"payrecall/mcp-server/client"
	"payrecall/mcp-server/tools"
)

func init() {
	// StdioTransport owns stdout for JSON-RPC; send all log output to stderr.
	log.SetOutput(os.Stderr)
}

func main() {
	// The backend URL can be overridden via BACKEND_URL env var.
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://localhost:8080"
	}

	api := client.New(backendURL)

	// Build the MCP server.
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "payrecall-mcp",
		Version: "v1.0.0",
	}, nil)

	// Tool 1 — get_transaction
	mcp.AddTool(
		server,
		&mcp.Tool{
			Name: "get_transaction",
			Description: `Retrieve the internal payment transaction details for a given transaction ID,
including merchant, amount, payment method, internal transaction status and retry information.
Use this as the first step when investigating any payment issue.`,
		},
		tools.GetTransactionHandler(api),
	)

	// Tool 2 — get_gateway_status
	mcp.AddTool(
		server,
		&mcp.Tool{
			Name: "get_gateway_status",
			Description: `Retrieve the payment gateway processing result for a transaction.
Use this when investigating whether the external payment gateway processed or authorized
a payment differently from the internal payment platform.
A mismatch between internal FAILED and gateway AUTHORIZED is a strong signal of a webhook delivery problem.`,
		},
		tools.GetGatewayStatusHandler(api),
	)

	// Tool 3 — get_webhook_attempts
	mcp.AddTool(
		server,
		&mcp.Tool{
			Name: "get_webhook_attempts",
			Description: `Retrieve webhook delivery attempts for a payment transaction,
including retries, HTTP status, timeout information and errors.
Use this when investigating whether merchant webhook delivery caused
inconsistent transaction state between the gateway and the internal platform.`,
		},
		tools.GetWebhookAttemptsHandler(api),
	)

	log.Println("PayRecall MCP server starting (stdio transport)...")
	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		log.Fatalf("MCP server error: %v", err)
	}
}
