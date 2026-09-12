package database

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"
)

// testQueries opens a connection, begins a transaction, and rolls it back
// at the end of the test — no committed writes, no shared test DB state
// (decision 03/Q29 in the map: transaction-per-test, no testcontainers).
func testQueries(t *testing.T) *Queries {
	t.Helper()

	for _, path := range []string{".env", "../.env", "../../.env", "../../../.env", "../../../../.env"} {
		if err := godotenv.Load(path); err == nil {
			break
		}
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set, skipping DB-backed test")
	}

	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}

	tx, err := conn.Begin(context.Background())
	if err != nil {
		t.Fatalf("begin tx: %v", err)
	}

	t.Cleanup(func() {
		_ = tx.Rollback(context.Background())
		_ = conn.Close(context.Background())
	})

	return New(tx)
}

func parseTestDate(t *testing.T, s string) pgtype.Date {
	t.Helper()
	parsed, err := time.Parse("2006-01-02", s)
	if err != nil {
		t.Fatalf("parse date: %v", err)
	}
	return pgtype.Date{Time: parsed, Valid: true}
}

func parseTestNumeric(t *testing.T, s string) pgtype.Numeric {
	t.Helper()
	var n pgtype.Numeric
	if err := n.Scan(s); err != nil {
		t.Fatalf("parse numeric: %v", err)
	}
	return n
}

func TestCreateAndListMeasurements(t *testing.T) {
	q := testQueries(t)
	ctx := context.Background()

	created, err := q.CreateMeasurement(ctx, CreateMeasurementParams{
		Date: parseTestDate(t, "2026-09-09"),
		Kg:   parseTestNumeric(t, "82.4"),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	rows, err := q.ListMeasurements(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}

	found := false
	for _, r := range rows {
		if r.ID == created.ID {
			found = true
		}
	}
	if !found {
		t.Fatal("created measurement not found in list")
	}
}

func TestUpdateMeasurement(t *testing.T) {
	q := testQueries(t)
	ctx := context.Background()

	created, err := q.CreateMeasurement(ctx, CreateMeasurementParams{
		Date: parseTestDate(t, "2026-09-09"),
		Kg:   parseTestNumeric(t, "82.4"),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	updated, err := q.UpdateMeasurement(ctx, UpdateMeasurementParams{
		ID:   created.ID,
		Date: parseTestDate(t, "2026-09-09"),
		Kg:   parseTestNumeric(t, "81.9"),
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	got, err := updated.Kg.Float64Value()
	if err != nil {
		t.Fatal(err)
	}
	if got.Float64 != 81.9 {
		t.Fatalf("expected 81.9, got %v", got.Float64)
	}
}

func TestUpdateMeasurementNotFound(t *testing.T) {
	q := testQueries(t)
	ctx := context.Background()

	_, err := q.UpdateMeasurement(ctx, UpdateMeasurementParams{
		ID:   pgtype.UUID{Valid: true}, // zero UUID, won't match any row
		Date: parseTestDate(t, "2026-09-09"),
		Kg:   parseTestNumeric(t, "80"),
	})
	if err != pgx.ErrNoRows {
		t.Fatalf("expected pgx.ErrNoRows, got %v", err)
	}
}

func TestDeleteMeasurement(t *testing.T) {
	q := testQueries(t)
	ctx := context.Background()

	created, err := q.CreateMeasurement(ctx, CreateMeasurementParams{
		Date: parseTestDate(t, "2026-09-09"),
		Kg:   parseTestNumeric(t, "82.4"),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := q.DeleteMeasurement(ctx, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	rows, err := q.ListMeasurements(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	for _, r := range rows {
		if r.ID == created.ID {
			t.Fatal("deleted measurement still present")
		}
	}
}
