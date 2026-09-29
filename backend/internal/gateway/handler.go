package gateway

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler serves gateway HTTP endpoints.
type Handler struct {
	repo *Repository
}

// NewHandler creates a new gateway Handler.
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// GET /api/transactions/{transactionID}/gateway
func (h *Handler) GetGatewayTransaction(w http.ResponseWriter, r *http.Request) {
	txnID := chi.URLParam(r, "transactionID")

	g, err := h.repo.GetByTransactionID(r.Context(), txnID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "transaction not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, g)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
