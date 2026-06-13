// Local calendar date, not UTC (toISOString would roll over at the wrong
// moment near midnight for the user's actual timezone) — same approach
// measurement-drawer.tsx's todayString() and routes/status.tsx already use.
// Promoted here from features/habits/today.ts once Nutrition needed the
// same "today" string too — a second real usage, not a hypothetical one.
export function todayString(from = new Date()) {
  const year = from.getFullYear();
  const month = String(from.getMonth() + 1).padStart(2, "0");
  const day = String(from.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
