package training

// workoutTypes is the 4-value vocabulary Exercises and Templates carry —
// deliberately narrower than a Session's, since no Exercise or Template is
// inherently "Freestyle" (ticket 01's amendment).
var workoutTypes = map[string]bool{"push": true, "pull": true, "legs": true, "cardio": true}

// sessionWorkoutTypes is the 5-value vocabulary a Session's own
// workoutType is drawn from — the 4 real types plus Freestyle.
var sessionWorkoutTypes = map[string]bool{"push": true, "pull": true, "legs": true, "cardio": true, "freestyle": true}

var exerciseTypes = map[string]bool{"strength": true, "cardio": true}

var setTypes = map[string]bool{"warmup": true, "working": true, "failure": true, "drop": true}

func validateWorkoutType(t string) map[string]string {
	errs := map[string]string{}
	if !workoutTypes[t] {
		errs["workoutType"] = "must be one of push, pull, legs, cardio"
	}
	return errs
}

func validateSessionWorkoutType(t string) map[string]string {
	errs := map[string]string{}
	if !sessionWorkoutTypes[t] {
		errs["workoutType"] = "must be one of push, pull, legs, cardio, freestyle"
	}
	return errs
}

func validateCreateExercise(req CreateExerciseRequest) map[string]string {
	errs := map[string]string{}
	if req.Name == "" {
		errs["name"] = "required"
	}
	if !exerciseTypes[req.Type] {
		errs["type"] = "must be strength or cardio"
	}
	for field, msg := range validateWorkoutType(req.WorkoutType) {
		errs[field] = msg
	}
	return errs
}

func validateCreateWorkoutTemplate(req CreateWorkoutTemplateRequest) map[string]string {
	errs := map[string]string{}
	if req.Name == "" {
		errs["name"] = "required"
	}
	for field, msg := range validateWorkoutType(req.WorkoutType) {
		errs[field] = msg
	}
	return errs
}

func validateSaveAsTemplate(req SaveAsTemplateRequest) map[string]string {
	errs := map[string]string{}
	if req.Name == "" {
		errs["name"] = "required"
	}
	for field, msg := range validateWorkoutType(req.WorkoutType) {
		errs[field] = msg
	}
	return errs
}

func validateCreateWorkoutSession(req CreateWorkoutSessionRequest) map[string]string {
	return validateSessionWorkoutType(req.WorkoutType)
}

func validateSetType(t string) map[string]string {
	errs := map[string]string{}
	if t != "" && !setTypes[t] {
		errs["setType"] = "must be one of warmup, working, failure, drop"
	}
	return errs
}

func validateCreateWorkoutSet(req CreateWorkoutSetRequest) map[string]string {
	errs := map[string]string{}
	if req.SessionExerciseID == "" {
		errs["sessionExerciseId"] = "required"
	}
	if !setTypes[req.SetType] {
		errs["setType"] = "must be one of warmup, working, failure, drop"
	}
	return errs
}
