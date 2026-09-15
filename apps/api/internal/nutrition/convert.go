package nutrition

import (
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

const dateLayout = "2006-01-02"

// FoodResponse is the JSON shape returned for a single Food Definition.
type FoodResponse struct {
	ID                 string  `json:"id"`
	Name               string  `json:"name"`
	ServingLabel       string  `json:"servingLabel"`
	CaloriesPerServing float64 `json:"caloriesPerServing"`
	ProteinPerServing  float64 `json:"proteinPerServing"`
	CarbsPerServing    float64 `json:"carbsPerServing"`
	FatPerServing      float64 `json:"fatPerServing"`
	CreatedAt          string  `json:"createdAt"`
}

// FoodEntryResponse is the JSON shape returned for a single Food Entry
// (Event) — already-quantity-multiplied macros, snapshotted at log time.
type FoodEntryResponse struct {
	ID        string  `json:"id"`
	FoodID    *string `json:"foodId"`
	Name      string  `json:"name"`
	Quantity  float64 `json:"quantity"`
	Calories  float64 `json:"calories"`
	Protein   float64 `json:"protein"`
	Carbs     float64 `json:"carbs"`
	Fat       float64 `json:"fat"`
	Date      string  `json:"date"`
	CreatedAt string  `json:"createdAt"`
}

// CreateFoodRequest is the JSON body accepted for POST /api/foods.
type CreateFoodRequest struct {
	Name               string  `json:"name"`
	ServingLabel       string  `json:"servingLabel"`
	CaloriesPerServing float64 `json:"caloriesPerServing"`
	ProteinPerServing  float64 `json:"proteinPerServing"`
	CarbsPerServing    float64 `json:"carbsPerServing"`
	FatPerServing      float64 `json:"fatPerServing"`
}

// UpdateFoodRequest is the JSON body accepted for PATCH /api/foods/{id} —
// a genuine partial update, every field optional.
type UpdateFoodRequest struct {
	Name               *string  `json:"name"`
	ServingLabel       *string  `json:"servingLabel"`
	CaloriesPerServing *float64 `json:"caloriesPerServing"`
	ProteinPerServing  *float64 `json:"proteinPerServing"`
	CarbsPerServing    *float64 `json:"carbsPerServing"`
	FatPerServing      *float64 `json:"fatPerServing"`
}

// CreateFoodEntryRequest is the JSON body accepted for POST
// /api/food-entries. Macros are never submitted by the client — the
// handler computes them from the referenced Food's per-serving values.
type CreateFoodEntryRequest struct {
	FoodID   string  `json:"foodId"`
	Quantity float64 `json:"quantity"`
	Date     string  `json:"date"`
}

// UpdateFoodEntryRequest is the JSON body accepted for PATCH
// /api/food-entries/{id} — quantity only.
type UpdateFoodEntryRequest struct {
	Quantity float64 `json:"quantity"`
}

func toFoodResponse(f database.Food) (FoodResponse, error) {
	id, err := uuid.FromBytes(f.ID.Bytes[:])
	if err != nil {
		return FoodResponse{}, err
	}

	calories, err := f.CaloriesPerServing.Float64Value()
	if err != nil {
		return FoodResponse{}, err
	}
	protein, err := f.ProteinPerServing.Float64Value()
	if err != nil {
		return FoodResponse{}, err
	}
	carbs, err := f.CarbsPerServing.Float64Value()
	if err != nil {
		return FoodResponse{}, err
	}
	fat, err := f.FatPerServing.Float64Value()
	if err != nil {
		return FoodResponse{}, err
	}

	return FoodResponse{
		ID:                 id.String(),
		Name:               f.Name,
		ServingLabel:       f.ServingLabel,
		CaloriesPerServing: calories.Float64,
		ProteinPerServing:  protein.Float64,
		CarbsPerServing:    carbs.Float64,
		FatPerServing:      fat.Float64,
		CreatedAt:          f.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toFoodEntryResponse(e database.FoodEntry) (FoodEntryResponse, error) {
	id, err := uuid.FromBytes(e.ID.Bytes[:])
	if err != nil {
		return FoodEntryResponse{}, err
	}

	var foodID *string
	if e.FoodID.Valid {
		parsed, err := uuid.FromBytes(e.FoodID.Bytes[:])
		if err != nil {
			return FoodEntryResponse{}, err
		}
		s := parsed.String()
		foodID = &s
	}

	quantity, err := e.Quantity.Float64Value()
	if err != nil {
		return FoodEntryResponse{}, err
	}
	calories, err := e.Calories.Float64Value()
	if err != nil {
		return FoodEntryResponse{}, err
	}
	protein, err := e.Protein.Float64Value()
	if err != nil {
		return FoodEntryResponse{}, err
	}
	carbs, err := e.Carbs.Float64Value()
	if err != nil {
		return FoodEntryResponse{}, err
	}
	fat, err := e.Fat.Float64Value()
	if err != nil {
		return FoodEntryResponse{}, err
	}

	return FoodEntryResponse{
		ID:        id.String(),
		FoodID:    foodID,
		Name:      e.Name,
		Quantity:  quantity.Float64,
		Calories:  calories.Float64,
		Protein:   protein.Float64,
		Carbs:     carbs.Float64,
		Fat:       fat.Float64,
		Date:      e.Date.Time.Format(dateLayout),
		CreatedAt: e.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toNumeric(f float64) (pgtype.Numeric, error) {
	var n pgtype.Numeric
	if err := n.Scan(strconv.FormatFloat(f, 'f', -1, 64)); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func numericToFloat64(n pgtype.Numeric) (float64, error) {
	v, err := n.Float64Value()
	if err != nil {
		return 0, err
	}
	return v.Float64, nil
}

func parseUUID(s string) (pgtype.UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: parsed, Valid: true}, nil
}

func parseDate(s string) (pgtype.Date, error) {
	t, err := time.Parse(dateLayout, s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}
