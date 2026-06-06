package habits

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// Handler serves the /api/habits routes.
type Handler struct {
	queries *database.Queries
}

func NewHandler(q *database.Queries) *Handler {
	return &Handler{queries: q}
}

// Register wires the routes onto mux (Go 1.22+ pattern routing), each
// behind protect. Literal segments ("reorder", "entries") take precedence
// over the {id} wildcard at the same position, so these don't conflict.
func (h *Handler) Register(mux *http.ServeMux, protect func(http.Handler) http.Handler) {
	mux.Handle("GET /api/habits", protect(http.HandlerFunc(h.list)))
	mux.Handle("POST /api/habits", protect(http.HandlerFunc(h.create)))
	mux.Handle("PATCH /api/habits/{id}", protect(http.HandlerFunc(h.update)))
	mux.Handle("POST /api/habits/reorder", protect(http.HandlerFunc(h.reorder)))
	mux.Handle("GET /api/habits/entries", protect(http.HandlerFunc(h.listEntries)))
	mux.Handle("POST /api/habits/entries", protect(http.HandlerFunc(h.createEntry)))
	mux.Handle("DELETE /api/habits/entries/{id}", protect(http.HandlerFunc(h.deleteEntry)))
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListHabits(r.Context())
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
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateName(req.Name); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	// New habits are always created active (decision 07) — check that
	// doesn't push active count past the max before inserting.
	active, err := h.queries.CountActiveHabits(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if active >= maxActiveHabits {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
			"active": fmt.Sprintf("cannot exceed %d active habits", maxActiveHabits),
		})
		return
	}

	row, err := h.queries.CreateHabit(r.Context(), req.Name)
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

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if req.Name != nil {
		if errs := validateName(*req.Name); len(errs) > 0 {
			writeErrors(w, http.StatusUnprocessableEntity, errs)
			return
		}
	}

	current, err := h.queries.GetHabit(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	if req.Active != nil && *req.Active != current.Active {
		activeCount, err := h.queries.CountActiveHabits(r.Context())
		if err != nil {
			writeInternalError(w, err)
			return
		}

		if *req.Active {
			if activeCount+1 > maxActiveHabits {
				writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
					"active": fmt.Sprintf("cannot exceed %d active habits", maxActiveHabits),
				})
				return
			}
		} else {
			if activeCount-1 < minActiveHabits {
				writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
					"active": fmt.Sprintf("at least %d habits must stay active", minActiveHabits),
				})
				return
			}
		}
	}

	params := database.UpdateHabitParams{ID: id}
	if req.Name != nil {
		params.Name = pgtype.Text{String: *req.Name, Valid: true}
	}
	if req.Active != nil {
		params.Active = pgtype.Bool{Bool: *req.Active, Valid: true}
	}

	row, err := h.queries.UpdateHabit(r.Context(), params)
	if err != nil {
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

func (h *Handler) reorder(w http.ResponseWriter, r *http.Request) {
	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	ids := make([]pgtype.UUID, 0, len(req.IDs))
	for _, s := range req.IDs {
		id, err := parseUUID(s)
		if err != nil {
			writeErrors(w, http.StatusBadRequest, map[string]string{"ids": "invalid id"})
			return
		}
		ids = append(ids, id)
	}

	if err := h.queries.ReorderHabits(r.Context(), ids); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) listEntries(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListHabitEntries(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp := make([]EntryResponse, 0, len(rows))
	for _, row := range rows {
		item, err := toEntryResponse(row)
		if err != nil {
			writeInternalError(w, err)
			return
		}
		resp = append(resp, item)
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) createEntry(w http.ResponseWriter, r *http.Request) {
	var req CreateEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateEntryDate(req.Date); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	habitID, err := parseUUID(req.HabitID)
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"habitId": "invalid id"})
		return
	}

	date, err := parseDate(req.Date)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"date": "invalid date"})
		return
	}

	row, err := h.queries.CreateHabitEntry(r.Context(), database.CreateHabitEntryParams{
		HabitID: habitID,
		Date:    date,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505": // unique_violation — already completed this habit today
				writeErrors(w, http.StatusConflict, map[string]string{"date": "already logged for this habit"})
				return
			case "23503": // foreign_key_violation — habitId doesn't exist
				writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"habitId": "not found"})
				return
			}
		}
		writeInternalError(w, err)
		return
	}

	resp, err := toEntryResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

func (h *Handler) deleteEntry(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	if err := h.queries.DeleteHabitEntry(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("habits: failed to encode response: %v", err)
	}
}

func writeErrors(w http.ResponseWriter, status int, errs map[string]string) {
	writeJSON(w, status, map[string]any{"errors": errs})
}

func writeInternalError(w http.ResponseWriter, err error) {
	log.Printf("habits: internal error: %v", err)
	writeErrors(w, http.StatusInternalServerError, map[string]string{"server": "internal error"})
}
