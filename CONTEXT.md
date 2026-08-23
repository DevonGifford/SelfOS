# SelfOS

SelfOS is a mobile-first personal logging system for nutrition, training, habits, and body weight — it records small facts quickly, preserves the raw history, and derives status/progress from those facts later.

## Language

### Data categories

**Event** (also **Observation**):
A record of something that happened at a point in time — a weight reading, a food entry, a workout set, a habit completion. Corrected by editing in place or a real delete; never silently rewritten by a later change elsewhere.
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

Multiple Weight Events can exist for the same day (e.g. a morning and an evening reading) — nothing prevents it, and nothing should. Anywhere a single current body-weight number is shown (Status, trend charts, the Measurements page's "Latest"), it's derived as that day's *lowest* reading, never simply the most recently logged one, and that rule is applied the same way in every one of those places — a value that's correct in one view and wrong in another is worse than a slightly conservative rule applied consistently.

**Status**:
A read model, not its own source-of-truth domain — the current-day rollup combining Nutrition, Training, Habits, and Weight. Always derived live from the underlying Events/Definitions/Configuration; never its own stored table.

### Client architecture

**Client Seam**:
The single import boundary (`data/client.ts`) every feature hook goes through. Feature code never imports `demo-client.ts` or `api-client.ts` directly. Domains migrate to real data independently, not as one wholesale swap: `client.ts` re-exports all of `demo-client.ts`, then each domain's functions are individually re-exported from `api-client.ts` as they go real — a named export shadows a star-export of the same name (spec-legal, not an ambiguity error), so a domain with a real backend and a domain still on demo data can coexist in the same seam. Once every domain has a real implementation, `demo-client.ts` and the wholesale re-export are dead code and get deleted.

**Demo Mode**:
The state where no domain has an `api-client.ts` override yet — every `get*`/mutation function resolves to `demo-client.ts`, writes simulate in-memory and reset on refresh, no backend involved. The natural starting state of a new domain, and the fallback for a public/portfolio deployment that never gets Supabase credentials.

**Personal Mode**:
The end state where every domain has been migrated (see Client Seam) — the Client Seam resolves entirely to `api-client.ts` (Go API → Supabase Postgres), writes persist for real. Getting there is gradual: the app spends most of its life in a transitional mix, some domains real and some still on demo data, and that's the expected, unremarkable middle state — not a bug to fix by rushing every domain to real data at once.

**Undo**:
A short client-side window immediately after an action (e.g. "82.4 KG LOGGED — UNDO"), not a database mechanism. All deletes are real deletes — there is no soft-delete/`deleted_at` anywhere in the schema.
