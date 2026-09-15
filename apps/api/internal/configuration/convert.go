package configuration

import (
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// Response is the JSON shape returned for the single Configuration row. No
// id — Configuration is a genuine singleton, never addressed by id at the
// API surface.
type Response struct {
	NutritionCaloriesTarget float64 `json:"nutritionCaloriesTarget"`
	NutritionProteinTarget  float64 `json:"nutritionProteinTarget"`
	NutritionCarbsTarget    float64 `json:"nutritionCarbsTarget"`
	NutritionFatTarget      float64 `json:"nutritionFatTarget"`
}

// Request is the JSON body accepted for update — always all four fields
// together, no partial-update semantics (mirrors measurements' Request).
type Request struct {
	NutritionCaloriesTarget float64 `json:"nutritionCaloriesTarget"`
	NutritionProteinTarget  float64 `json:"nutritionProteinTarget"`
	NutritionCarbsTarget    float64 `json:"nutritionCarbsTarget"`
	NutritionFatTarget      float64 `json:"nutritionFatTarget"`
}

func toResponse(c database.Configuration) (Response, error) {
	calories, err := numericToFloat64(c.NutritionCaloriesTarget)
	if err != nil {
		return Response{}, err
	}
	protein, err := numericToFloat64(c.NutritionProteinTarget)
	if err != nil {
		return Response{}, err
	}
	carbs, err := numericToFloat64(c.NutritionCarbsTarget)
	if err != nil {
		return Response{}, err
	}
	fat, err := numericToFloat64(c.NutritionFatTarget)
	if err != nil {
		return Response{}, err
	}

	return Response{
		NutritionCaloriesTarget: calories,
		NutritionProteinTarget:  protein,
		NutritionCarbsTarget:    carbs,
		NutritionFatTarget:      fat,
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
