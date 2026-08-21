package measurements

import "time"

// validate enforces the same rules the frontend pre-validates for instant
// feedback (decision 03/Q22 in the map) — this is the authoritative check.
func validate(req Request) map[string]string {
	errs := map[string]string{}

	if req.Kg <= 0 {
		errs["kg"] = "must be positive"
	}

	date, err := time.Parse(dateLayout, req.Date)
	if err != nil {
		errs["date"] = "must be a valid date (YYYY-MM-DD)"
	} else if date.After(startOfToday()) {
		errs["date"] = "cannot be in the future"
	}

	return errs
}

func startOfToday() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}
