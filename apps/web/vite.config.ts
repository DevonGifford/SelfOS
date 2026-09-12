import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxied so api-client.ts can call relative paths ("/api/...") the
      // same way it would same-origin in production — avoids CORS in dev
      // entirely rather than the Go API needing a dev-only CORS path.
      // VITE_API_PROXY_TARGET is set by compose.yaml to the api service's
      // Docker DNS name; falls back to localhost for running outside Docker.
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
