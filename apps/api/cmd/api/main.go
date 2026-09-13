package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
	"github.com/DevonGifford/SelfOS/apps/api/internal/measurements"
)

func main() {
	loadEnv()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	queries := database.New(pool)

	mux := http.NewServeMux()
	// Under the /api prefix, not bare /health — every path this server
	// actually receives arrives with that prefix intact (Vercel's Services
	// rewrite forwards it unchanged, and so does apps/web's dev proxy).
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	measurements.NewHandler(queries).Register(mux)

	// Vercel's Go runtime requires the server to listen on PORT; API_ADDR is
	// this repo's own pre-existing convention (compose.yaml sets it), so it
	// still wins locally when both happen to be set.
	addr := os.Getenv("API_ADDR")
	if addr == "" {
		if port := os.Getenv("PORT"); port != "" {
			addr = ":" + port
		} else {
			addr = ":8080"
		}
	}

	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server: %v", err)
	}
}

// loadEnv loads the repo-root .env whether the binary is run from
// apps/api (go run ./cmd/api during local dev) or the repo root, and is a
// no-op if neither is found — Docker's compose env_file already sets real
// OS env vars in that case, so a missing .env there is expected, not fatal.
func loadEnv() {
	for _, path := range []string{".env", "../.env", "../../.env", "../../../.env", "../../../../.env"} {
		if err := godotenv.Load(path); err == nil {
			return
		}
	}
}
