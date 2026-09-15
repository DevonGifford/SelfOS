-- name: ListHabits :many
select * from habits
order by position asc;

-- name: GetHabit :one
select * from habits
where id = $1;

-- name: CountActiveHabits :one
select count(*) from habits
where active = true;

-- name: CreateHabit :one
insert into habits (name, active, position)
values ($1, true, (select coalesce(max(position), -1) + 1 from habits))
returning *;

-- name: UpdateHabit :one
update habits
set
  name = coalesce(sqlc.narg('name'), name),
  active = coalesce(sqlc.narg('active'), active)
where id = $1
returning *;

-- name: ReorderHabits :exec
update habits
set position = t.idx - 1
from unnest(sqlc.arg('ids')::uuid[]) with ordinality as t(id, idx)
where habits.id = t.id;

-- name: ListHabitEntries :many
select * from habit_entries
order by date desc, created_at desc;

-- name: CreateHabitEntry :one
insert into habit_entries (habit_id, date)
values ($1, $2)
returning *;

-- name: DeleteHabitEntry :exec
delete from habit_entries
where id = $1;
