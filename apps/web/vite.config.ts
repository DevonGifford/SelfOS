import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SelfOS",
        short_name: "SelfOS",
        display: "standalone",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the app shell only — no runtime caching rule for /api/*.
        // The navigation fallback must never serve index.html for an API
        // request, or WeightSchema.parse() fails on a document that starts
        // with "<!doctype html>" instead of JSON.
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
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
