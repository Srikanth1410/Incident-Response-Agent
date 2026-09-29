package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	"payrecall/internal/db"
	"payrecall/internal/gateway"
	"payrecall/internal/transaction"
	"payrecall/internal/webhook"
)

func main() {
	// Load .env before anything else.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	ctx := context.Background()

	// Connect to PostgreSQL via pgx connection pool.
	pool, err := db.Connect(ctx)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	// Wire up repositories and handlers.
	txnRepo := transaction.NewRepository(pool)
	txnHandler := transaction.NewHandler(txnRepo)

	gwRepo := gateway.NewRepository(pool)
	gwHandler := gateway.NewHandler(gwRepo)

	wbRepo := webhook.NewRepository(pool)
	wbHandler := webhook.NewHandler(wbRepo)

	// Build the chi router.
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// API routes.
	r.Route("/api/transactions/{transactionID}", func(r chi.Router) {
		r.Get("/", txnHandler.GetTransaction)
		r.Get("/gateway", gwHandler.GetGatewayTransaction)
		r.Get("/webhooks", wbHandler.ListWebhookAttempts)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("PayRecall server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
