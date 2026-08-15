# SelfOS

SelfOS is a mobile-first personal logging system for nutrition, training, habits, mood/energy, and body weight — it records small facts quickly, preserves the raw history, and derives status/progress from those facts later.

## Language

### Data categories

**Event** (also **Observation**):
A record of something that happened at a point in time — a weight reading, a food entry, a workout set, a mood entry, a habit completion. Corrected by editing in place or a real delete; never silently rewritten by a later change elsewhere.
_Avoid_: Record, log (as a noun)

**Definition**:
A reusable template that Events reference — a Food, an Exercise, a Workout Template, a Habit. Represents something that *can* be logged against, not something that happened.
_Avoid_: Entity, template (reserve "template" for Workout Template specifically)

**Configuration**:
Settings that affect how Events are interpreted or scheduled — Nutrition Targets, Training Schedule, user preferences. Neither an Event nor a Definition.

### Domains

**Habit** vs **Habit Entry**:
A Habit is the Definition (name, active, schedule). A Habit Entry is the Event — one completion of that habit on a given day.

**Food** vs **Food Entry**:
A Food is the Definition (name, serving size, calories/macros per serving). A Food Entry is the Event — a snapshot of those macros at the moment it was logged, independent of later edits to the Food definition.

**Exercise** vs **Workout Session** vs **Workout Set**:
An Exercise is the Definition (e.g. "Bench Press"). A Workout Session is one training occasion (e.g. today's Push day). A Workout Set is one Event within that session (weight/reps, or duration/distance, for one set of one exercise).

**Weight** — ambiguous, disambiguate explicitly:
Two unrelated concepts share this word here: **body weight** (the Weight domain — what the user weighs) and **load** (`workout_sets.weight_kg` — how much the user lifted). Never use bare "weight" where both are in scope.
_Avoid_: bare "weight" when ambiguous — say "body weight" or "load" / "weight lifted"

**Status**:
A read model, not its own source-of-truth domain — the current-day rollup combining Nutrition, Training, Habits, Mood, and Weight. Always derived live from the underlying Events/Definitions/Configuration; never its own stored table.

### Client architecture

**Client Seam**:
The single import boundary (`data/client.ts`) every feature hook goes through. Feature code never imports `demo-client.ts`, or a future `api-client.ts`, directly.

**Demo Mode**:
A deployment mode where the Client Seam points at `demo-client.ts` — writes simulate in-memory and reset on refresh. No backend involved.

**Personal Mode**:
The real single-user deployment — the Client Seam points at `api-client.ts` (Go API → Supabase Postgres), writes persist for real.

**Undo**:
A short client-side window immediately after an action (e.g. "82.4 KG LOGGED — UNDO"), not a database mechanism. All deletes are real deletes — there is no soft-delete/`deleted_at` anywhere in the schema.
