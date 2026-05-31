import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "@/app/app-shell";
import { checkSession } from "@/data/auth-client";
import { ComingSoonPage } from "@/routes/coming-soon";
import { HabitsPage } from "@/routes/habits";
import { HomePage } from "@/routes/home";
import { LoginPage } from "@/routes/login";
import { MeasurementsPage } from "@/routes/measurements";
import { NutritionPage } from "@/routes/nutrition";
import { TrainingPage } from "@/routes/training";

// Runs before AppShell renders, so there's no shell-flash-then-bounce
// (ticket 09 §3). A real 401 already triggers a hard redirect inside
// parseOrThrow (data/http.ts) before this ever sees the rejection; any
// other failure is a network error (offline, scope B), not an expired
// session, so the loader resolves normally and lets the shell render from
// the service-worker-precached shell instead of blocking on it.
async function sessionLoader() {
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
        element: (
          <ComingSoonPage
            title="Settings"
            description="Profile and app-wide settings — Nutrition Targets, Training Schedule, and more — land here once there's a real Configuration surface to edit them from."
          />
        ),
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
    ],
  },
]);
