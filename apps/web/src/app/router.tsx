import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "@/app/app-shell";
import { HabitsPage } from "@/routes/habits";
import { MeasurementsPage } from "@/routes/measurements";
import { NutritionPage } from "@/routes/nutrition";
import { StatusPage } from "@/routes/status";
import { TrainingPage } from "@/routes/training";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/status" replace />,
      },
      {
        path: "status",
        element: <StatusPage />,
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
    ],
  },
]);
