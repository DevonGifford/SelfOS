import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "@/app/app-shell";
import { checkSession } from "@/data/auth-client";
import { isGuestSession } from "@/data/guest";
import { ComingSoonPage } from "@/routes/coming-soon";
import { HabitsPage } from "@/routes/habits";
import { HomePage } from "@/routes/home";
import { LoginPage } from "@/routes/login";
import { MeasurementsPage } from "@/routes/measurements";
import { NutritionPage } from "@/routes/nutrition";
import { SettingsPage } from "@/routes/settings";
import { TrainingPage } from "@/routes/training";

// Runs before AppShell renders, so there's no shell-flash-then-bounce
// (ticket 09 §3). A real 401 already triggers a hard redirect inside
// parseOrThrow (data/http.ts) before this ever sees the rejection; any
// other failure is a network error (offline, scope B), not an expired
// session, so the loader resolves normally and lets the shell render from
// the service-worker-precached shell instead of blocking on it.
//
// A guest session never sets the real cookie, so checkSession() would
// always 401 and parseOrThrow would bounce straight back to /login before
// this function's own try/catch ever runs — skip it entirely for guests.
async function sessionLoader() {
  if (isGuestSession()) return null;

  try {
    await checkSession();
  } catch {
    // Swallow here — see comment above for why.
  }
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    loader: sessionLoader,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "home",
        element: <HomePage />,
      },
      {
        path: "nutrition",
        element: <NutritionPage />,
      },
      {
        path: "training",
        element: <TrainingPage />,
      },
      {
        path: "habits",
        element: <HabitsPage />,
      },
      {
        path: "measurements",
        element: <MeasurementsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "habits/history",
        element: (
          <ComingSoonPage title="Habits History" description="A dedicated view of your habit streaks and completion history over time." />
        ),
      },
      {
        path: "nutrition/history",
        element: (
          <ComingSoonPage title="Nutrition Trends" description="Macro trends over time — calories, protein, carbs, and fat across days and weeks." />
        ),
      },
      {
        path: "training/history",
        element: (
          <ComingSoonPage title="Training History" description="A full log of past sessions, once workout logging itself is built." />
        ),
      },
      {
        path: "measurements/history",
        element: (
          <ComingSoonPage title="Weight History" description="A dedicated trend view — the Measurements page's own trend and log stay where they are for now." />
        ),
      },
      {
        path: "nutrition/barcode-scan",
        element: (
          <ComingSoonPage title="Barcode Scan" description="Scan a food's barcode to log it instantly — coming soon." />
        ),
      },
      {
        path: "nutrition/voice-log",
        element: (
          <ComingSoonPage title="Voice Log" description="Describe what you ate out loud and have it logged automatically — coming soon." />
        ),
      },
      {
        path: "nutrition/meal-scan",
        element: (
          <ComingSoonPage title="Meal Scan" description="Snap a photo of your meal and have it logged automatically — coming soon." />
        ),
      },
    ],
  },
]);
