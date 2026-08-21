package measurements

import (
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

const dateLayout = "2006-01-02"

// Response is the JSON shape returned for a single measurement.
type Response struct {
	ID        string  `json:"id"`
	Date      string  `json:"date"`
	Kg        float64 `json:"kg"`
	CreatedAt string  `json:"createdAt"`
}

// Request is the JSON body accepted for create and update — always both
// fields together, no partial-update semantics (see decision 03).
type Request struct {
	Date string  `json:"date"`
	Kg   float64 `json:"kg"`
}

func toResponse(m database.Measurement) (Response, error) {
	kg, err := m.Kg.Float64Value()
	if err != nil {
		return Response{}, err
	}

	id, err := uuid.FromBytes(m.ID.Bytes[:])
	if err != nil {
		return Response{}, err
	}

	return Response{
		ID:        id.String(),
		Date:      m.Date.Time.Format(dateLayout),
		Kg:        kg.Float64,
		CreatedAt: m.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func parseDate(s string) (pgtype.Date, error) {
	t, err := time.Parse(dateLayout, s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func kgToNumeric(kg float64) (pgtype.Numeric, error) {
	var n pgtype.Numeric
	if err := n.Scan(strconv.FormatFloat(kg, 'f', -1, 64)); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func parseUUID(s string) (pgtype.UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: parsed, Valid: true}, nil
}
