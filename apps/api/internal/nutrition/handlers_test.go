package nutrition

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// testHandler opens a connection, begins a transaction, and rolls it back
// at the end of the test — same isolation habits/measurements both use.
// Also clears this domain's tables inside the transaction before
// returning, so tests get a deterministic empty view regardless of real
// rows logged through the app locally — the delete itself rolls back with
// everything else, so real data is untouched.
func testHandler(t *testing.T) *Handler {
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

	if _, err := tx.Exec(context.Background(), `delete from food_entries; delete from foods;`); err != nil {
		t.Fatalf("clear nutrition tables: %v", err)
	}

	return NewHandler(database.New(tx))
}

func noAuth(next http.Handler) http.Handler { return next }

func doRequest(h *Handler, method, path string, body any) *httptest.ResponseRecorder {
	mux := http.NewServeMux()
	h.Register(mux, noAuth)

	var reader *bytes.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		reader = bytes.NewReader(b)
	} else {
		reader = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func createFood(t *testing.T, h *Handler, name string) FoodResponse {
	t.Helper()
	rec := doRequest(h, http.MethodPost, "/api/foods", CreateFoodRequest{
		Name:               name,
		ServingLabel:       "1 bowl",
		CaloriesPerServing: 420,
		ProteinPerServing:  18,
		CarbsPerServing:    62,
		FatPerServing:      10,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create food %q: expected 201, got %d: %s", name, rec.Code, rec.Body.String())
	}
	var resp FoodResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode create response: %v", err)
	}
	return resp
}

func decodeErrors(t *testing.T, rec *httptest.ResponseRecorder) map[string]string {
	t.Helper()
	var body struct {
		Errors map[string]string `json:"errors"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode errors: %v", err)
	}
	return body.Errors
}

func TestCreateFood(t *testing.T) {
	h := testHandler(t)

	resp := createFood(t, h, "Oats & berries")
	if resp.Name != "Oats & berries" || resp.ServingLabel != "1 bowl" || resp.CaloriesPerServing != 420 {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestCreateFoodValidation(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPost, "/api/foods", CreateFoodRequest{Name: "", ServingLabel: "1 bowl"})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["name"]; !ok {
		t.Fatalf("expected error on field name, got %v", decodeErrors(t, rec))
	}
}

func TestListFoods(t *testing.T) {
	h := testHandler(t)

	createFood(t, h, "Oats & berries")
	createFood(t, h, "Protein shake")

	rec := doRequest(h, http.MethodGet, "/api/foods", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var resp []FoodResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp) != 2 {
		t.Fatalf("expected 2 foods, got %d", len(resp))
	}
}

func TestUpdateFood(t *testing.T) {
	h := testHandler(t)

	created := createFood(t, h, "Oats & berries")

	newName := "Oats & blueberries"
	rec := doRequest(h, http.MethodPatch, "/api/foods/"+created.ID, UpdateFoodRequest{Name: &newName})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated FoodResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.Name != "Oats & blueberries" || updated.CaloriesPerServing != 420 {
		t.Fatalf("unexpected response: %+v", updated)
	}
}

func TestDeleteFood(t *testing.T) {
	h := testHandler(t)

	created := createFood(t, h, "Oats & berries")

	rec := doRequest(h, http.MethodDelete, "/api/foods/"+created.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	listRec := doRequest(h, http.MethodGet, "/api/foods", nil)
	var resp []FoodResponse
	if err := json.Unmarshal(listRec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	for _, f := range resp {
		if f.ID == created.ID {
			t.Fatal("deleted food still present in list")
		}
	}
}

func TestCreateEntryComputesMacrosServerSide(t *testing.T) {
	h := testHandler(t)

	food := createFood(t, h, "Oats & berries")

	rec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{
		FoodID:   food.ID,
		Quantity: 1.5,
		Date:     "2026-09-14",
		MealSlot: "breakfast",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var entry FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if entry.Name != "Oats & berries" || entry.Calories != 630 || entry.Protein != 27 {
		t.Fatalf("unexpected computed macros: %+v", entry)
	}
	if entry.FoodID == nil || *entry.FoodID != food.ID {
		t.Fatalf("expected foodId %q, got %+v", food.ID, entry.FoodID)
	}
}

func TestCreateEntryWithManualMacroOverrides(t *testing.T) {
	h := testHandler(t)

	food := createFood(t, h, "Oats & berries")

	calories, protein, carbs, fat := 500.0, 30.0, 40.0, 20.0
	rec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{
		FoodID: food.ID, Quantity: 1.5, Date: "2026-09-14", MealSlot: "dinner",
		Calories: &calories, Protein: &protein, Carbs: &carbs, Fat: &fat,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var entry FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode: %v", err)
	}
	// Explicit overrides must be stored as-is, NOT recomputed from the
	// food's per-serving rate (1.5 * 420 = 630, not 500).
	if entry.Quantity != 1.5 || entry.Calories != 500 || entry.Protein != 30 || entry.Carbs != 40 || entry.Fat != 20 {
		t.Fatalf("expected explicit overrides to be stored as-is, got %+v", entry)
	}
}

func TestCreateEntryUnknownFoodRejected(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{
		FoodID:   "00000000-0000-0000-0000-000000000000",
		Quantity: 1,
		Date:     "2026-09-14",
		MealSlot: "breakfast",
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["foodId"]; !ok {
		t.Fatalf("expected error on field foodId, got %v", decodeErrors(t, rec))
	}
}

func TestCreateEntryFutureDateRejected(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	rec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{
		FoodID: food.ID, Quantity: 1, Date: "2099-01-01", MealSlot: "breakfast",
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestListEntries(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 2, Date: "2026-09-13", MealSlot: "dinner"})

	rec := doRequest(h, http.MethodGet, "/api/food-entries", nil)
	var entries []FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &entries); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
}

func TestUpdateEntryQuantityRecomputesMacros(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	rec := doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{Quantity: 2})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.Calories != 840 || updated.Quantity != 2 {
		t.Fatalf("unexpected recomputed macros: %+v", updated)
	}
}

func TestUpdateEntryMealSlot(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	snack := "snack"
	rec := doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{Quantity: 1, MealSlot: &snack})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.MealSlot != "snack" {
		t.Fatalf("expected mealSlot snack, got %+v", updated)
	}

	// Omitting mealSlot entirely (the existing quantity-only shape) must
	// keep whatever slot the entry currently has, not reset it.
	rec = doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{Quantity: 2})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.MealSlot != "snack" {
		t.Fatalf("expected mealSlot to remain snack when omitted, got %+v", updated)
	}
}

func TestUpdateEntryRequiresValidMealSlot(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	brunch := "brunch"
	rec := doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{Quantity: 1, MealSlot: &brunch})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestUpdateEntryWithManualMacroOverrides(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	calories, protein, carbs, fat := 500.0, 30.0, 40.0, 20.0
	rec := doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{
		Quantity: 1.5, Calories: &calories, Protein: &protein, Carbs: &carbs, Fat: &fat,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	// Explicit overrides must be stored as-is, NOT recomputed from the
	// food's per-serving rate (1.5 * 420 = 630, not 500).
	if updated.Quantity != 1.5 || updated.Calories != 500 || updated.Protein != 30 || updated.Carbs != 40 || updated.Fat != 20 {
		t.Fatalf("expected explicit overrides to be stored as-is, got %+v", updated)
	}
}

func TestUpdateEntryOrphanedWithManualOverridesSucceeds(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	deleteRec := doRequest(h, http.MethodDelete, "/api/foods/"+food.ID, nil)
	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("setup: expected 204 deleting food, got %d", deleteRec.Code)
	}

	// Unlike the quantity-only path (TestUpdateEntryAfterFoodDeletedRejected),
	// explicit macro overrides need no live Food, so this succeeds.
	calories, protein, carbs, fat := 300.0, 15.0, 20.0, 5.0
	rec := doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{
		Quantity: 1, Calories: &calories, Protein: &protein, Carbs: &carbs, Fat: &fat,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated FoodEntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.Calories != 300 || updated.FoodID != nil {
		t.Fatalf("unexpected response: %+v", updated)
	}
}

func TestCreateEntryRequiresValidMealSlot(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	rec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{
		FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "brunch",
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["mealSlot"]; !ok {
		t.Fatalf("expected error on field mealSlot, got %v", decodeErrors(t, rec))
	}
}

func TestUpdateEntryAfterFoodDeletedRejected(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	deleteRec := doRequest(h, http.MethodDelete, "/api/foods/"+food.ID, nil)
	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("setup: expected 204 deleting food, got %d", deleteRec.Code)
	}

	// The entry survives the Food's deletion (food_id set null) with its
	// snapshot intact — confirm that before testing the PATCH rejection.
	listRec := doRequest(h, http.MethodGet, "/api/food-entries", nil)
	var entries []FoodEntryResponse
	if err := json.Unmarshal(listRec.Body.Bytes(), &entries); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(entries) != 1 || entries[0].Name != "Oats & berries" || entries[0].FoodID != nil {
		t.Fatalf("expected surviving orphaned entry with nulled foodId, got %+v", entries)
	}

	rec := doRequest(h, http.MethodPatch, "/api/food-entries/"+entry.ID, UpdateFoodEntryRequest{Quantity: 2})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestDeleteEntry(t *testing.T) {
	h := testHandler(t)
	food := createFood(t, h, "Oats & berries")

	createRec := doRequest(h, http.MethodPost, "/api/food-entries", CreateFoodEntryRequest{FoodID: food.ID, Quantity: 1, Date: "2026-09-14", MealSlot: "breakfast"})
	var entry FoodEntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create: %v", err)
	}

	rec := doRequest(h, http.MethodDelete, "/api/food-entries/"+entry.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	listRec := doRequest(h, http.MethodGet, "/api/food-entries", nil)
	var entries []FoodEntryResponse
	if err := json.Unmarshal(listRec.Body.Bytes(), &entries); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	for _, e := range entries {
		if e.ID == entry.ID {
			t.Fatal("deleted entry still present in list")
		}
	}
}
