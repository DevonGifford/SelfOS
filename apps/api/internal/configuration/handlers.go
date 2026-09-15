package configuration

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// Handler serves the /api/configuration routes.
type Handler struct {
	queries *database.Queries
}

func NewHandler(q *database.Queries) *Handler {
	return &Handler{queries: q}
}

// Register wires the two routes onto mux — no {id} segment, unlike every
// other domain here: Configuration is a genuine singleton, seeded by its
// own migration, so there's always exactly one row and nothing to address
// by id.
func (h *Handler) Register(mux *http.ServeMux, protect func(http.Handler) http.Handler) {
	mux.Handle("GET /api/configuration", protect(http.HandlerFunc(h.get)))
	mux.Handle("PATCH /api/configuration", protect(http.HandlerFunc(h.update)))
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	row, err := h.queries.GetConfiguration(r.Context())
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

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validate(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	calories, err := toNumeric(req.NutritionCaloriesTarget)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"nutritionCaloriesTarget": "invalid number"})
		return
	}
	protein, err := toNumeric(req.NutritionProteinTarget)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"nutritionProteinTarget": "invalid number"})
		return
	}
	carbs, err := toNumeric(req.NutritionCarbsTarget)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"nutritionCarbsTarget": "invalid number"})
		return
	}
	fat, err := toNumeric(req.NutritionFatTarget)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"nutritionFatTarget": "invalid number"})
		return
	}

	row, err := h.queries.UpdateConfiguration(r.Context(), database.UpdateConfigurationParams{
		NutritionCaloriesTarget: calories,
		NutritionProteinTarget:  protein,
		NutritionCarbsTarget:    carbs,
		NutritionFatTarget:      fat,
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

	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("configuration: failed to encode response: %v", err)
	}
}

func writeErrors(w http.ResponseWriter, status int, errs map[string]string) {
	writeJSON(w, status, map[string]any{"errors": errs})
}

func writeInternalError(w http.ResponseWriter, err error) {
	log.Printf("configuration: internal error: %v", err)
	writeErrors(w, http.StatusInternalServerError, map[string]string{"server": "internal error"})
}
