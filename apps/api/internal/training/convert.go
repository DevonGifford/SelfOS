package training

import (
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

const dateLayout = "2006-01-02"

// ExerciseResponse is the JSON shape for a single Exercise Definition.
type ExerciseResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	WorkoutType string `json:"workoutType"`
	CreatedAt   string `json:"createdAt"`
}

// CreateExerciseRequest is the JSON body accepted for POST
// /api/training/exercises.
type CreateExerciseRequest struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	WorkoutType string `json:"workoutType"`
}

// WorkoutTemplateResponse is the JSON shape for a single Workout Template
// Definition. Its suggested sets are fetched separately via GET
// /api/training/templates/{id}/sets — flat resources the client
// correlates, matching this app's existing convention rather than nested
// JSON.
type WorkoutTemplateResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	WorkoutType string `json:"workoutType"`
	IsDefault   bool   `json:"isDefault"`
	Archived    bool   `json:"archived"`
	CreatedAt   string `json:"createdAt"`
}

// CreateWorkoutTemplateRequest is the JSON body accepted for POST
// /api/training/templates.
type CreateWorkoutTemplateRequest struct {
	Name        string `json:"name"`
	WorkoutType string `json:"workoutType"`
}

// WorkoutTemplateSetResponse is one suggested set within a Template.
type WorkoutTemplateSetResponse struct {
	ID           string   `json:"id"`
	TemplateID   string   `json:"templateId"`
	ExerciseID   *string  `json:"exerciseId"`
	ExerciseName string   `json:"exerciseName"`
	Position     int32    `json:"position"`
	SetType      string   `json:"setType"`
	WeightKg     *float64 `json:"weightKg"`
	Reps         *int32   `json:"reps"`
	DurationSec  *int32   `json:"durationSec"`
	DistanceM    *float64 `json:"distanceM"`
}

// WorkoutSessionResponse is the JSON shape for a Workout Session. Sessions
// persist from Start (ADR 0003), so `finishedAt` is null while in
// progress — that's the "in progress" state, not a separate status field.
type WorkoutSessionResponse struct {
	ID          string  `json:"id"`
	WorkoutType string  `json:"workoutType"`
	TemplateID  *string `json:"templateId"`
	Note        *string `json:"note"`
	Date        string  `json:"date"`
	FinishedAt  *string `json:"finishedAt"`
	CreatedAt   string  `json:"createdAt"`
}

// CreateWorkoutSessionRequest is the JSON body accepted for POST
// /api/training/sessions — starting a Session, optionally from a Template.
type CreateWorkoutSessionRequest struct {
	WorkoutType string  `json:"workoutType"`
	TemplateID  *string `json:"templateId"`
}

// UpdateWorkoutSessionRequest is a genuine partial update — the session
// note, and its start/finish times (ticket 03: a Session's own times are
// user-editable, e.g. to fix a bogus duration after a crash).
type UpdateWorkoutSessionRequest struct {
	Note       *string `json:"note"`
	StartedAt  *string `json:"startedAt"`
	FinishedAt *string `json:"finishedAt"`
}

// SaveAsTemplateRequest is the JSON body for POST
// /api/training/sessions/{id}/save-as-template.
type SaveAsTemplateRequest struct {
	WorkoutType string `json:"workoutType"`
	Name        string `json:"name"`
}

// WorkoutSessionExerciseResponse is one Exercise-within-a-Session — the
// home for an exercise-level note and its display position (ticket 01's
// workout_session_exercises table).
type WorkoutSessionExerciseResponse struct {
	ID           string  `json:"id"`
	SessionID    string  `json:"sessionId"`
	ExerciseID   *string `json:"exerciseId"`
	ExerciseName string  `json:"exerciseName"`
	Note         *string `json:"note"`
	Position     int32   `json:"position"`
}

// CreateSessionExerciseRequest is the JSON body for POST
// /api/training/sessions/{id}/exercises.
type CreateSessionExerciseRequest struct {
	ExerciseID string `json:"exerciseId"`
}

// UpdateSessionExerciseRequest — note only; renaming/reordering/replacing
// each have their own dedicated action instead of a general PATCH.
type UpdateSessionExerciseRequest struct {
	Note *string `json:"note"`
}

// ReplaceSessionExerciseRequest is the JSON body for POST
// .../session-exercises/{id}/replace.
type ReplaceSessionExerciseRequest struct {
	ExerciseID string `json:"exerciseId"`
}

// ReorderSessionExercisesRequest is the JSON body for POST
// /api/training/sessions/{id}/exercises/reorder — the full ordered list of
// session-exercise ids, mirroring habits' ReorderRequest shape.
type ReorderSessionExercisesRequest struct {
	IDs []string `json:"ids"`
}

// WorkoutSetResponse is one logged Set (Event) — weight/reps for strength
// Exercises, duration/distance for cardio ones. `confirmed` backs the
// pending-rows-you-confirm interaction the logging UI settled on: a set
// seeded from a Template starts unconfirmed until the user taps to
// confirm it.
type WorkoutSetResponse struct {
	ID                string   `json:"id"`
	SessionExerciseID string   `json:"sessionExerciseId"`
	SetType           string   `json:"setType"`
	Confirmed         bool     `json:"confirmed"`
	Note              *string  `json:"note"`
	WeightKg          *float64 `json:"weightKg"`
	Reps              *int32   `json:"reps"`
	DurationSec       *int32   `json:"durationSec"`
	DistanceM         *float64 `json:"distanceM"`
	CreatedAt         string   `json:"createdAt"`
}

// CreateWorkoutSetRequest is the JSON body for POST /api/training/sets.
type CreateWorkoutSetRequest struct {
	SessionExerciseID string   `json:"sessionExerciseId"`
	SetType           string   `json:"setType"`
	WeightKg          *float64 `json:"weightKg"`
	Reps              *int32   `json:"reps"`
	DurationSec       *int32   `json:"durationSec"`
	DistanceM         *float64 `json:"distanceM"`
	Note              *string  `json:"note"`
}

// UpdateWorkoutSetRequest is a genuine partial update — every field
// (including `confirmed`, the toggle a tap on the checkmark sends) may be
// omitted.
type UpdateWorkoutSetRequest struct {
	SetType     *string  `json:"setType"`
	Confirmed   *bool    `json:"confirmed"`
	WeightKg    *float64 `json:"weightKg"`
	Reps        *int32   `json:"reps"`
	DurationSec *int32   `json:"durationSec"`
	DistanceM   *float64 `json:"distanceM"`
	Note        *string  `json:"note"`
}

func toExerciseResponse(e database.Exercise) (ExerciseResponse, error) {
	id, err := uuid.FromBytes(e.ID.Bytes[:])
	if err != nil {
		return ExerciseResponse{}, err
	}

	return ExerciseResponse{
		ID:          id.String(),
		Name:        e.Name,
		Type:        e.Type,
		WorkoutType: e.WorkoutType,
		CreatedAt:   e.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toWorkoutTemplateResponse(t database.WorkoutTemplate) (WorkoutTemplateResponse, error) {
	id, err := uuid.FromBytes(t.ID.Bytes[:])
	if err != nil {
		return WorkoutTemplateResponse{}, err
	}

	return WorkoutTemplateResponse{
		ID:          id.String(),
		Name:        t.Name,
		WorkoutType: t.WorkoutType,
		IsDefault:   t.IsDefault,
		Archived:    t.Archived,
		CreatedAt:   t.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toWorkoutTemplateSetResponse(s database.WorkoutTemplateSet) (WorkoutTemplateSetResponse, error) {
	id, err := uuid.FromBytes(s.ID.Bytes[:])
	if err != nil {
		return WorkoutTemplateSetResponse{}, err
	}
	templateID, err := uuid.FromBytes(s.TemplateID.Bytes[:])
	if err != nil {
		return WorkoutTemplateSetResponse{}, err
	}
	exerciseID, err := optionalUUID(s.ExerciseID)
	if err != nil {
		return WorkoutTemplateSetResponse{}, err
	}
	weightKg, err := optionalNumeric(s.WeightKg)
	if err != nil {
		return WorkoutTemplateSetResponse{}, err
	}
	distanceM, err := optionalNumeric(s.DistanceM)
	if err != nil {
		return WorkoutTemplateSetResponse{}, err
	}

	return WorkoutTemplateSetResponse{
		ID:           id.String(),
		TemplateID:   templateID.String(),
		ExerciseID:   exerciseID,
		ExerciseName: s.ExerciseName,
		Position:     s.Position,
		SetType:      s.SetType,
		WeightKg:     weightKg,
		Reps:         optionalInt32(s.Reps),
		DurationSec:  optionalInt32(s.DurationSec),
		DistanceM:    distanceM,
	}, nil
}

func toWorkoutSessionResponse(s database.WorkoutSession) (WorkoutSessionResponse, error) {
	id, err := uuid.FromBytes(s.ID.Bytes[:])
	if err != nil {
		return WorkoutSessionResponse{}, err
	}
	templateID, err := optionalUUID(s.TemplateID)
	if err != nil {
		return WorkoutSessionResponse{}, err
	}

	return WorkoutSessionResponse{
		ID:          id.String(),
		WorkoutType: s.WorkoutType,
		TemplateID:  templateID,
		Note:        optionalText(s.Note),
		Date:        s.Date.Time.Format(dateLayout),
		FinishedAt:  optionalTimestamptz(s.FinishedAt),
		CreatedAt:   s.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toWorkoutSessionExerciseResponse(e database.WorkoutSessionExercise) (WorkoutSessionExerciseResponse, error) {
	id, err := uuid.FromBytes(e.ID.Bytes[:])
	if err != nil {
		return WorkoutSessionExerciseResponse{}, err
	}
	sessionID, err := uuid.FromBytes(e.SessionID.Bytes[:])
	if err != nil {
		return WorkoutSessionExerciseResponse{}, err
	}
	exerciseID, err := optionalUUID(e.ExerciseID)
	if err != nil {
		return WorkoutSessionExerciseResponse{}, err
	}

	return WorkoutSessionExerciseResponse{
		ID:           id.String(),
		SessionID:    sessionID.String(),
		ExerciseID:   exerciseID,
		ExerciseName: e.ExerciseName,
		Note:         optionalText(e.Note),
		Position:     e.Position,
	}, nil
}

func toWorkoutSetResponse(s database.WorkoutSet) (WorkoutSetResponse, error) {
	id, err := uuid.FromBytes(s.ID.Bytes[:])
	if err != nil {
		return WorkoutSetResponse{}, err
	}
	sessionExerciseID, err := uuid.FromBytes(s.SessionExerciseID.Bytes[:])
	if err != nil {
		return WorkoutSetResponse{}, err
	}
	weightKg, err := optionalNumeric(s.WeightKg)
	if err != nil {
		return WorkoutSetResponse{}, err
	}
	distanceM, err := optionalNumeric(s.DistanceM)
	if err != nil {
		return WorkoutSetResponse{}, err
	}

	return WorkoutSetResponse{
		ID:                id.String(),
		SessionExerciseID: sessionExerciseID.String(),
		SetType:           s.SetType,
		Confirmed:         s.Confirmed,
		Note:              optionalText(s.Note),
		WeightKg:          weightKg,
		Reps:              optionalInt32(s.Reps),
		DurationSec:       optionalInt32(s.DurationSec),
		DistanceM:         distanceM,
		CreatedAt:         s.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

// ---- shared nullable-field helpers ----
// Every other domain's Definition/Event split only ever needed
// pgtype.Text/Bool for partial updates (habits, foods). Training's Events
// carry several genuinely-optional numeric fields at once (strength vs
// cardio Sets share one table), so these are worth factoring out rather
// than repeating the same nil-check five times per converter.

func optionalUUID(id pgtype.UUID) (*string, error) {
	if !id.Valid {
		return nil, nil
	}
	parsed, err := uuid.FromBytes(id.Bytes[:])
	if err != nil {
		return nil, err
	}
	s := parsed.String()
	return &s, nil
}

func optionalText(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	s := t.String
	return &s
}

func optionalTimestamptz(ts pgtype.Timestamptz) *string {
	if !ts.Valid {
		return nil
	}
	s := ts.Time.Format(time.RFC3339)
	return &s
}

func optionalNumeric(n pgtype.Numeric) (*float64, error) {
	if !n.Valid {
		return nil, nil
	}
	v, err := n.Float64Value()
	if err != nil {
		return nil, err
	}
	f := v.Float64
	return &f, nil
}

func optionalInt32(i pgtype.Int4) *int32 {
	if !i.Valid {
		return nil
	}
	v := i.Int32
	return &v
}

func toNumericPtr(f *float64) (pgtype.Numeric, error) {
	if f == nil {
		return pgtype.Numeric{}, nil
	}
	var n pgtype.Numeric
	if err := n.Scan(strconv.FormatFloat(*f, 'f', -1, 64)); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func toInt4Ptr(i *int32) pgtype.Int4 {
	if i == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *i, Valid: true}
}

func toTextPtr(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func toBoolPtr(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}

func parseUUID(s string) (pgtype.UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: parsed, Valid: true}, nil
}

// parseOptionalUUID treats an empty string as "not provided" (Valid:
// false) rather than an error — used for CreateWorkoutSessionRequest's
// optional templateId.
func parseOptionalUUID(s *string) (pgtype.UUID, error) {
	if s == nil || *s == "" {
		return pgtype.UUID{}, nil
	}
	return parseUUID(*s)
}

func parseDate(s string) (pgtype.Date, error) {
	t, err := time.Parse(dateLayout, s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func parseTimestamptz(s string) (pgtype.Timestamptz, error) {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return pgtype.Timestamptz{}, err
	}
	return pgtype.Timestamptz{Time: t, Valid: true}, nil
}

func startOfToday() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}
