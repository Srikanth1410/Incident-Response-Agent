package incident

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

// Handler serves incident HTTP endpoints.
type Handler struct {
	repo *Repository
}

// NewHandler creates a new incident Handler.
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// POST /api/incidents
// Body: CreateIncidentRequest
// Creates an OPEN incident record from the agent's diagnosis.
func (h *Handler) CreateIncident(w http.ResponseWriter, r *http.Request) {
	var req CreateIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.TransactionID == "" {
		writeError(w, http.StatusBadRequest, "transaction_id is required")
		return
	}

	// Generate a time-based incident ID.
	incidentID := fmt.Sprintf("INC-%d", time.Now().UnixMilli()%1_000_000)

	inc, err := h.repo.Create(r.Context(), req, incidentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create incident")
		return
	}
	writeJSON(w, http.StatusCreated, inc)
}

// GET /api/incidents/{incidentID}
func (h *Handler) GetIncident(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "incidentID")
	inc, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "incident not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, inc)
}

// PATCH /api/incidents/{incidentID}/resolve
// Body: ResolveIncidentRequest
// Operator confirms root cause, resolution, outcome, and actions taken.
func (h *Handler) ResolveIncident(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "incidentID")

	var req ResolveIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.ConfirmedRootCause == "" || req.Outcome == "" {
		writeError(w, http.StatusBadRequest, "confirmed_root_cause and outcome are required")
		return
	}

	inc, err := h.repo.Resolve(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeError(w, http.StatusNotFound, "incident not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to resolve incident")
		return
	}
	writeJSON(w, http.StatusOK, inc)
}

// PATCH /api/incidents/{incidentID}/memory-saved
// Called by the Python agent after Hindsight retain() succeeds.
func (h *Handler) MarkMemorySaved(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "incidentID")
	if err := h.repo.MarkMemorySaved(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to mark memory saved")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "memory_saved"})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
