-- name: ListExercises :many
select * from exercises
order by name asc;

-- name: GetExercise :one
select * from exercises
where id = $1;

-- name: CreateExercise :one
insert into exercises (name, type, workout_type)
values ($1, $2, $3)
returning *;

-- name: DeleteExercise :exec
delete from exercises
where id = $1;

-- name: ListWorkoutTemplates :many
select * from workout_templates
order by workout_type asc, is_default desc, name asc;

-- name: GetWorkoutTemplate :one
select * from workout_templates
where id = $1;

-- name: CreateWorkoutTemplate :one
insert into workout_templates (name, workout_type)
values ($1, $2)
returning *;

-- name: ArchiveWorkoutTemplate :one
update workout_templates
set archived = true
where id = $1 and is_default = false
returning *;

-- name: RestoreWorkoutTemplate :one
update workout_templates
set archived = false
where id = $1
returning *;

-- name: ClearDefaultWorkoutTemplate :exec
update workout_templates
set is_default = false
where workout_type = $1 and is_default = true;

-- name: SetDefaultWorkoutTemplate :one
update workout_templates
set is_default = true, archived = false
where id = $1
returning *;

-- name: ListWorkoutTemplateSets :many
select * from workout_template_sets
where template_id = $1
order by position asc;

-- name: CreateWorkoutTemplateSet :one
insert into workout_template_sets (
  template_id, exercise_id, exercise_name, position, set_type, weight_kg, reps, duration_sec, distance_m
)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
returning *;

-- name: DeleteWorkoutTemplateSetsByTemplate :exec
delete from workout_template_sets
where template_id = $1;

-- name: CreateWorkoutSession :one
insert into workout_sessions (workout_type, template_id, date)
values ($1, $2, $3)
returning *;

-- name: GetWorkoutSession :one
select * from workout_sessions
where id = $1;

-- name: ListWorkoutSessions :many
select * from workout_sessions
order by date desc, created_at desc;

-- name: GetUnfinishedWorkoutSession :one
select * from workout_sessions
where finished_at is null
order by created_at desc
limit 1;

-- name: FinishWorkoutSession :one
update workout_sessions
set finished_at = now()
where id = $1
returning *;

-- name: UpdateWorkoutSession :one
update workout_sessions
set
  note = coalesce(sqlc.narg('note'), note),
  created_at = coalesce(sqlc.narg('created_at'), created_at),
  finished_at = coalesce(sqlc.narg('finished_at'), finished_at)
where id = $1
returning *;

-- name: DeleteWorkoutSession :exec
delete from workout_sessions
where id = $1;

-- name: ListWorkoutSessionExercises :many
select * from workout_session_exercises
where session_id = $1
order by position asc;

-- name: CreateWorkoutSessionExercise :one
insert into workout_session_exercises (session_id, exercise_id, exercise_name, position)
values (
  $1, $2, $3,
  (select coalesce(max(position), -1) + 1 from workout_session_exercises where session_id = $1)
)
returning *;

-- name: UpdateWorkoutSessionExercise :one
update workout_session_exercises
set note = coalesce(sqlc.narg('note'), note)
where id = $1
returning *;

-- name: ReplaceWorkoutSessionExerciseExercise :one
update workout_session_exercises
set exercise_id = $2, exercise_name = $3, note = null
where id = $1
returning *;

-- name: ReorderWorkoutSessionExercises :exec
update workout_session_exercises
set position = t.idx - 1
from unnest(sqlc.arg('ids')::uuid[]) with ordinality as t(id, idx)
where workout_session_exercises.id = t.id;

-- name: DeleteWorkoutSessionExercise :exec
delete from workout_session_exercises
where id = $1;

-- name: ListWorkoutSetsBySessionExercise :many
select * from workout_sets
where session_exercise_id = $1
order by created_at asc;

-- name: ListWorkoutSetsBySession :many
select workout_sets.*
from workout_sets
join workout_session_exercises on workout_session_exercises.id = workout_sets.session_exercise_id
where workout_session_exercises.session_id = $1
order by workout_sets.created_at asc;

-- name: CreateWorkoutSet :one
insert into workout_sets (
  session_exercise_id, set_type, weight_kg, reps, duration_sec, distance_m, note
)
values ($1, $2, $3, $4, $5, $6, $7)
returning *;

-- name: UpdateWorkoutSet :one
update workout_sets
set
  set_type = coalesce(sqlc.narg('set_type'), set_type),
  confirmed = coalesce(sqlc.narg('confirmed'), confirmed),
  weight_kg = coalesce(sqlc.narg('weight_kg'), weight_kg),
  reps = coalesce(sqlc.narg('reps'), reps),
  duration_sec = coalesce(sqlc.narg('duration_sec'), duration_sec),
  distance_m = coalesce(sqlc.narg('distance_m'), distance_m),
  note = coalesce(sqlc.narg('note'), note)
where id = $1
returning *;

-- name: DeleteWorkoutSet :exec
delete from workout_sets
where id = $1;

-- name: DeleteWorkoutSetsBySessionExercise :exec
delete from workout_sets
where session_exercise_id = $1;

-- Progressive overload: the last Session-Exercise for this Exercise, from
-- the last Session of the given Workout Type — a two-step lookup (this,
-- then ListWorkoutSetsBySessionExercise for its sets) rather than one
-- complex join, matching how the rest of this codebase composes simple
-- queries in the handler instead of building the joined result in SQL.
-- name: GetLastSessionExerciseForType :one
select workout_session_exercises.*
from workout_session_exercises
join workout_sessions on workout_sessions.id = workout_session_exercises.session_id
where workout_session_exercises.exercise_id = $1
  and workout_sessions.workout_type = $2
  and workout_sessions.finished_at is not null
order by workout_sessions.date desc, workout_sessions.created_at desc
limit 1;
