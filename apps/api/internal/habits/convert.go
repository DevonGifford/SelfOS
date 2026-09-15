package habits

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

const dateLayout = "2006-01-02"

// Response is the JSON shape returned for a single habit Definition.
type Response struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Active    bool   `json:"active"`
	Position  int32  `json:"position"`
	CreatedAt string `json:"createdAt"`
}

// EntryResponse is the JSON shape returned for a single habit Entry (Event).
type EntryResponse struct {
	ID        string `json:"id"`
	HabitID   string `json:"habitId"`
	Date      string `json:"date"`
	CreatedAt string `json:"createdAt"`
}

// CreateRequest is the JSON body accepted for POST /api/habits.
type CreateRequest struct {
	Name string `json:"name"`
}

// UpdateRequest is the JSON body accepted for PATCH /api/habits/{id} — a
// genuine partial update (decision 08): either field may be omitted.
type UpdateRequest struct {
	Name   *string `json:"name"`
	Active *bool   `json:"active"`
}

// ReorderRequest is the JSON body accepted for POST /api/habits/reorder.
type ReorderRequest struct {
	IDs []string `json:"ids"`
}

// CreateEntryRequest is the JSON body accepted for POST /api/habits/entries.
type CreateEntryRequest struct {
	HabitID string `json:"habitId"`
	Date    string `json:"date"`
}

func toResponse(h database.Habit) (Response, error) {
	id, err := uuid.FromBytes(h.ID.Bytes[:])
	if err != nil {
		return Response{}, err
	}

	return Response{
		ID:        id.String(),
		Name:      h.Name,
		Active:    h.Active,
		Position:  h.Position,
		CreatedAt: h.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toEntryResponse(e database.HabitEntry) (EntryResponse, error) {
	id, err := uuid.FromBytes(e.ID.Bytes[:])
	if err != nil {
		return EntryResponse{}, err
	}

	habitID, err := uuid.FromBytes(e.HabitID.Bytes[:])
	if err != nil {
		return EntryResponse{}, err
	}

	return EntryResponse{
		ID:        id.String(),
		HabitID:   habitID.String(),
		Date:      e.Date.Time.Format(dateLayout),
		CreatedAt: e.CreatedAt.Time.Format(time.RFC3339),
	}, nil
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
