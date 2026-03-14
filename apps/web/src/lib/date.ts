// Local calendar date, not UTC (toISOString would roll over at the wrong
// moment near midnight for the user's actual timezone) — same approach
// measurement-drawer.tsx's todayString() and routes/home.tsx already use.
// Promoted here from features/habits/today.ts once Nutrition needed the
// same "today" string too — a second real usage, not a hypothetical one.
export function todayString(from = new Date()) {
  const year = from.getFullYear();
  const month = String(from.getMonth() + 1).padStart(2, "0");
  const day = String(from.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Local calendar date `offset` days from now (negative = past, positive =
// future) — the day-navigation math shared by any page that lets you page
// backward through recent days. Promoted here from routes/habits.tsx once
// Nutrition needed the same day-offset math too.
export function dateWithOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return todayString(d);
}
