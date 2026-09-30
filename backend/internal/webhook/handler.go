package webhook

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler serves webhook HTTP endpoints.
type Handler struct {
	repo *Repository
}

// NewHandler creates a new webhook Handler.
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// GET /api/transactions/{transactionID}/webhooks
func (h *Handler) ListWebhookAttempts(w http.ResponseWriter, r *http.Request) {
	txnID := chi.URLParam(r, "transactionID")

	attempts, err := h.repo.ListByTransactionID(r.Context(), txnID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, attempts)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
