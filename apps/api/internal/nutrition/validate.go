package nutrition

import "time"

func validateFood(req CreateFoodRequest) map[string]string {
	errs := map[string]string{}

	if req.Name == "" {
		errs["name"] = "required"
	}
	if req.ServingLabel == "" {
		errs["servingLabel"] = "required"
	}
	if req.CaloriesPerServing < 0 {
		errs["caloriesPerServing"] = "must not be negative"
	}
	if req.ProteinPerServing < 0 {
		errs["proteinPerServing"] = "must not be negative"
	}
	if req.CarbsPerServing < 0 {
		errs["carbsPerServing"] = "must not be negative"
	}
	if req.FatPerServing < 0 {
		errs["fatPerServing"] = "must not be negative"
	}

	return errs
}

func validateQuantity(quantity float64) map[string]string {
	errs := map[string]string{}
	if quantity <= 0 {
		errs["quantity"] = "must be positive"
	}
	return errs
}

var mealSlots = map[string]bool{"breakfast": true, "snack": true, "lunch": true, "tea": true, "dinner": true}

func validateMealSlot(slot string) map[string]string {
	errs := map[string]string{}
	if !mealSlots[slot] {
		errs["mealSlot"] = "must be one of breakfast, snack, lunch, tea, dinner"
	}
	return errs
}

func validateEntryDate(date string) map[string]string {
	errs := map[string]string{}

	t, err := time.Parse(dateLayout, date)
	if err != nil {
		errs["date"] = "must be a valid date (YYYY-MM-DD)"
		return errs
	}

	if t.After(startOfToday()) {
		errs["date"] = "cannot be in the future"
	}

	return errs
}

func startOfToday() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}
