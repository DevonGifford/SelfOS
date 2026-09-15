package habits

import "time"

const (
	minActiveHabits = 3
	maxActiveHabits = 10
)

// validateName is the authoritative check mirrored by the frontend's own
// pre-validation for instant feedback (decision 09), same split measurements
// uses for validate()/validate.go.
func validateName(name string) map[string]string {
	errs := map[string]string{}
	if name == "" {
		errs["name"] = "required"
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
