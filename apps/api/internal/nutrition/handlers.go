package nutrition

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// Handler serves the /api/foods and /api/food-entries routes.
type Handler struct {
	queries *database.Queries
}

func NewHandler(q *database.Queries) *Handler {
	return &Handler{queries: q}
}

func (h *Handler) Register(mux *http.ServeMux, protect func(http.Handler) http.Handler) {
	mux.Handle("GET /api/foods", protect(http.HandlerFunc(h.listFoods)))
	mux.Handle("POST /api/foods", protect(http.HandlerFunc(h.createFood)))
	mux.Handle("PATCH /api/foods/{id}", protect(http.HandlerFunc(h.updateFood)))
	mux.Handle("DELETE /api/foods/{id}", protect(http.HandlerFunc(h.deleteFood)))
	mux.Handle("GET /api/food-entries", protect(http.HandlerFunc(h.listEntries)))
	mux.Handle("POST /api/food-entries", protect(http.HandlerFunc(h.createEntry)))
	mux.Handle("PATCH /api/food-entries/{id}", protect(http.HandlerFunc(h.updateEntry)))
	mux.Handle("DELETE /api/food-entries/{id}", protect(http.HandlerFunc(h.deleteEntry)))
}

func (h *Handler) listFoods(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListFoods(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp := make([]FoodResponse, 0, len(rows))
	for _, row := range rows {
		item, err := toFoodResponse(row)
		if err != nil {
			writeInternalError(w, err)
			return
		}
		resp = append(resp, item)
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) createFood(w http.ResponseWriter, r *http.Request) {
	var req CreateFoodRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateFood(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	params, err := toCreateFoodParams(req)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"body": "invalid number"})
		return
	}

	row, err := h.queries.CreateFood(r.Context(), params)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp, err := toFoodResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

func toCreateFoodParams(req CreateFoodRequest) (database.CreateFoodParams, error) {
	calories, err := toNumeric(req.CaloriesPerServing)
	if err != nil {
		return database.CreateFoodParams{}, err
	}
	protein, err := toNumeric(req.ProteinPerServing)
	if err != nil {
		return database.CreateFoodParams{}, err
	}
	carbs, err := toNumeric(req.CarbsPerServing)
	if err != nil {
		return database.CreateFoodParams{}, err
	}
	fat, err := toNumeric(req.FatPerServing)
	if err != nil {
		return database.CreateFoodParams{}, err
	}

	return database.CreateFoodParams{
		Name:               req.Name,
		ServingLabel:       req.ServingLabel,
		CaloriesPerServing: calories,
		ProteinPerServing:  protein,
		CarbsPerServing:    carbs,
		FatPerServing:      fat,
	}, nil
}

func (h *Handler) updateFood(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req UpdateFoodRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if req.Name != nil && *req.Name == "" {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"name": "required"})
		return
	}
	if req.ServingLabel != nil && *req.ServingLabel == "" {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"servingLabel": "required"})
		return
	}

	params := database.UpdateFoodParams{ID: id}
	if req.Name != nil {
		params.Name = pgtype.Text{String: *req.Name, Valid: true}
	}
	if req.ServingLabel != nil {
		params.ServingLabel = pgtype.Text{String: *req.ServingLabel, Valid: true}
	}
	if req.CaloriesPerServing != nil {
		n, err := toNumeric(*req.CaloriesPerServing)
		if err != nil {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"caloriesPerServing": "invalid number"})
			return
		}
		params.CaloriesPerServing = n
	}
	if req.ProteinPerServing != nil {
		n, err := toNumeric(*req.ProteinPerServing)
		if err != nil {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"proteinPerServing": "invalid number"})
			return
		}
		params.ProteinPerServing = n
	}
	if req.CarbsPerServing != nil {
		n, err := toNumeric(*req.CarbsPerServing)
		if err != nil {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"carbsPerServing": "invalid number"})
			return
		}
		params.CarbsPerServing = n
	}
	if req.FatPerServing != nil {
		n, err := toNumeric(*req.FatPerServing)
		if err != nil {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"fatPerServing": "invalid number"})
			return
		}
		params.FatPerServing = n
	}

	row, err := h.queries.UpdateFood(r.Context(), params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	resp, err := toFoodResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) deleteFood(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	// food_entries.food_id is `on delete set null` (decision 13) — entries
	// referencing this Food survive, snapshot intact.
	if err := h.queries.DeleteFood(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) listEntries(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListFoodEntries(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp := make([]FoodEntryResponse, 0, len(rows))
	for _, row := range rows {
		item, err := toFoodEntryResponse(row)
		if err != nil {
			writeInternalError(w, err)
			return
		}
		resp = append(resp, item)
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) createEntry(w http.ResponseWriter, r *http.Request) {
	var req CreateFoodEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateQuantity(req.Quantity); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}
	if errs := validateEntryDate(req.Date); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}
	if errs := validateMealSlot(req.MealSlot); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	foodID, err := parseUUID(req.FoodID)
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"foodId": "invalid id"})
		return
	}

	food, err := h.queries.GetFood(r.Context(), foodID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"foodId": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	date, err := parseDate(req.Date)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"date": "invalid date"})
		return
	}

	var m macros
	if req.Calories != nil && req.Protein != nil && req.Carbs != nil && req.Fat != nil {
		// Manual override: the client already resolved final absolute
		// values (quantity-scaled base plus any per-macro nudge) — use
		// them directly rather than recomputing from the Food's rate.
		m, err = toMacros(req.Quantity, *req.Calories, *req.Protein, *req.Carbs, *req.Fat)
		if err != nil {
			writeInternalError(w, err)
			return
		}
	} else {
		m, err = computeMacros(food, req.Quantity)
		if err != nil {
			writeInternalError(w, err)
			return
		}
	}

	row, err := h.queries.CreateFoodEntry(r.Context(), database.CreateFoodEntryParams{
		FoodID:   foodID,
		Name:     food.Name,
		Quantity: m.quantity,
		Calories: m.calories,
		Protein:  m.protein,
		Carbs:    m.carbs,
		Fat:      m.fat,
		Date:     date,
		MealSlot: req.MealSlot,
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp, err := toFoodEntryResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

// macros is the quantity-multiplied result of computeMacros.
type macros struct {
	quantity pgtype.Numeric
	calories pgtype.Numeric
	protein  pgtype.Numeric
	carbs    pgtype.Numeric
	fat      pgtype.Numeric
}

// computeMacros multiplies a Food's per-serving rate by quantity — the
// server-side computation decision 14 requires (the client only ever
// submits quantity, never macros). Shared by createEntry (a new snapshot)
// and updateEntry (recomputing an existing one against the current rate).
func computeMacros(food database.Food, quantity float64) (macros, error) {
	caloriesRate, err := numericToFloat64(food.CaloriesPerServing)
	if err != nil {
		return macros{}, err
	}
	proteinRate, err := numericToFloat64(food.ProteinPerServing)
	if err != nil {
		return macros{}, err
	}
	carbsRate, err := numericToFloat64(food.CarbsPerServing)
	if err != nil {
		return macros{}, err
	}
	fatRate, err := numericToFloat64(food.FatPerServing)
	if err != nil {
		return macros{}, err
	}

	quantityNumeric, err := toNumeric(quantity)
	if err != nil {
		return macros{}, err
	}
	calories, err := toNumeric(caloriesRate * quantity)
	if err != nil {
		return macros{}, err
	}
	protein, err := toNumeric(proteinRate * quantity)
	if err != nil {
		return macros{}, err
	}
	carbs, err := toNumeric(carbsRate * quantity)
	if err != nil {
		return macros{}, err
	}
	fat, err := toNumeric(fatRate * quantity)
	if err != nil {
		return macros{}, err
	}

	return macros{
		quantity: quantityNumeric,
		calories: calories,
		protein:  protein,
		carbs:    carbs,
		fat:      fat,
	}, nil
}

// toMacros converts explicit client-supplied values into a macros struct —
// the manual-override counterpart to computeMacros, used when the caller
// has already resolved final numbers (e.g. quantity-scaled base plus a
// per-macro nudge) rather than asking the server to derive them from a
// live Food.
func toMacros(quantity, calories, protein, carbs, fat float64) (macros, error) {
	quantityNumeric, err := toNumeric(quantity)
	if err != nil {
		return macros{}, err
	}
	caloriesNumeric, err := toNumeric(calories)
	if err != nil {
		return macros{}, err
	}
	proteinNumeric, err := toNumeric(protein)
	if err != nil {
		return macros{}, err
	}
	carbsNumeric, err := toNumeric(carbs)
	if err != nil {
		return macros{}, err
	}
	fatNumeric, err := toNumeric(fat)
	if err != nil {
		return macros{}, err
	}

	return macros{
		quantity: quantityNumeric,
		calories: caloriesNumeric,
		protein:  proteinNumeric,
		carbs:    carbsNumeric,
		fat:      fatNumeric,
	}, nil
}

func (h *Handler) updateEntry(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req UpdateFoodEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateQuantity(req.Quantity); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	entry, err := h.queries.GetFoodEntry(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	mealSlot := entry.MealSlot
	if req.MealSlot != nil {
		if errs := validateMealSlot(*req.MealSlot); len(errs) > 0 {
			writeErrors(w, http.StatusUnprocessableEntity, errs)
			return
		}
		mealSlot = *req.MealSlot
	}

	var m macros
	if req.Calories != nil && req.Protein != nil && req.Carbs != nil && req.Fat != nil {
		// Manual override: the client already resolved final absolute
		// values (quantity-scaled base plus any per-macro nudge) — use
		// them directly. No live Food needed, so this also works on an
		// entry whose Food has since been deleted.
		m, err = toMacros(req.Quantity, *req.Calories, *req.Protein, *req.Carbs, *req.Fat)
		if err != nil {
			writeInternalError(w, err)
			return
		}
	} else {
		// Original behavior, unchanged: recompute from the live Food. The
		// Food this entry snapshot came from is gone (decision 14) — can't
		// recompute a rate that no longer exists. Delete and re-create
		// instead (or resubmit with explicit macro overrides, above).
		if !entry.FoodID.Valid {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
				"quantity": "original food no longer exists — delete and re-log this entry instead",
			})
			return
		}

		food, err := h.queries.GetFood(r.Context(), entry.FoodID)
		if err != nil {
			writeInternalError(w, err)
			return
		}

		m, err = computeMacros(food, req.Quantity)
		if err != nil {
			writeInternalError(w, err)
			return
		}
	}

	row, err := h.queries.UpdateFoodEntryQuantity(r.Context(), database.UpdateFoodEntryQuantityParams{
		ID:       id,
		Quantity: m.quantity,
		Calories: m.calories,
		Protein:  m.protein,
		Carbs:    m.carbs,
		Fat:      m.fat,
		MealSlot: mealSlot,
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	resp, err := toFoodEntryResponse(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) deleteEntry(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	if err := h.queries.DeleteFoodEntry(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("nutrition: failed to encode response: %v", err)
	}
}

func writeErrors(w http.ResponseWriter, status int, errs map[string]string) {
	writeJSON(w, status, map[string]any{"errors": errs})
}

func writeInternalError(w http.ResponseWriter, err error) {
	log.Printf("nutrition: internal error: %v", err)
	writeErrors(w, http.StatusInternalServerError, map[string]string{"server": "internal error"})
}
