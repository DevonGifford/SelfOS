package configuration

// validate enforces the same rules the frontend pre-validates for instant
// feedback — this is the authoritative check.
func validate(req Request) map[string]string {
	errs := map[string]string{}

	if req.NutritionCaloriesTarget <= 0 {
		errs["nutritionCaloriesTarget"] = "must be positive"
	}
	if req.NutritionProteinTarget <= 0 {
		errs["nutritionProteinTarget"] = "must be positive"
	}
	if req.NutritionCarbsTarget <= 0 {
		errs["nutritionCarbsTarget"] = "must be positive"
	}
	if req.NutritionFatTarget <= 0 {
		errs["nutritionFatTarget"] = "must be positive"
	}

	return errs
}
