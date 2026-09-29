package transaction

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler serves transaction HTTP endpoints.
type Handler struct {
	repo *Repository
}

// NewHandler creates a new transaction Handler.
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// GET /api/transactions/{transactionID}
func (h *Handler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	txnID := chi.URLParam(r, "transactionID")

	txn, err := h.repo.GetByID(r.Context(), txnID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "transaction not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, txn)
}

// writeJSON serialises v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError sends a JSON error body: {"error": "..."}.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
