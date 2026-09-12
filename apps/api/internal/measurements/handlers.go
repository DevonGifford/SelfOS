package measurements

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// Handler serves the /api/measurements routes.
type Handler struct {
	queries *database.Queries
}

func NewHandler(q *database.Queries) *Handler {
	return &Handler{queries: q}
}

// Register wires the four routes onto mux (Go 1.22+ pattern routing).
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/measurements", h.list)
	mux.HandleFunc("POST /api/measurements", h.create)
	mux.HandleFunc("PATCH /api/measurements/{id}", h.update)
	mux.HandleFunc("DELETE /api/measurements/{id}", h.delete)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListMeasurements(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp := make([]Response, 0, len(rows))
	for _, row := range rows {
		item, err := toResponse(row)
		if err != nil {
			writeInternalError(w, err)
			return
		}
		resp = append(resp, item)
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validate(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	date, err := parseDate(req.Date)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"date": "invalid date"})
		return
	}

	kg, err := kgToNumeric(req.Kg)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"kg": "invalid number"})
		return
	}

	row, err := h.queries.CreateMeasurement(r.Context(), database.CreateMeasurementParams{
		Date: date,
		Kg:   kg,
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp, err := toResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validate(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	date, err := parseDate(req.Date)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"date": "invalid date"})
		return
	}

	kg, err := kgToNumeric(req.Kg)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"kg": "invalid number"})
		return
	}

	row, err := h.queries.UpdateMeasurement(r.Context(), database.UpdateMeasurementParams{
		ID:   id,
		Date: date,
		Kg:   kg,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	resp, err := toResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	if err := h.queries.DeleteMeasurement(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("measurements: failed to encode response: %v", err)
	}
}

func writeErrors(w http.ResponseWriter, status int, errs map[string]string) {
	writeJSON(w, status, map[string]any{"errors": errs})
}

func writeInternalError(w http.ResponseWriter, err error) {
	log.Printf("measurements: internal error: %v", err)
	writeErrors(w, http.StatusInternalServerError, map[string]string{"server": "internal error"})
}
