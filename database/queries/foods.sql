-- name: ListFoods :many
select * from foods
order by name asc;

-- name: GetFood :one
select * from foods
where id = $1;

-- name: CreateFood :one
insert into foods (
  name, serving_label, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving
)
values ($1, $2, $3, $4, $5, $6)
returning *;

-- name: UpdateFood :one
update foods
set
  name = coalesce(sqlc.narg('name'), name),
  serving_label = coalesce(sqlc.narg('serving_label'), serving_label),
  calories_per_serving = coalesce(sqlc.narg('calories_per_serving'), calories_per_serving),
  protein_per_serving = coalesce(sqlc.narg('protein_per_serving'), protein_per_serving),
  carbs_per_serving = coalesce(sqlc.narg('carbs_per_serving'), carbs_per_serving),
  fat_per_serving = coalesce(sqlc.narg('fat_per_serving'), fat_per_serving)
where id = $1
returning *;

-- name: DeleteFood :exec
delete from foods
where id = $1;

-- name: ListFoodEntries :many
select * from food_entries
order by date desc, created_at desc;

-- name: GetFoodEntry :one
select * from food_entries
where id = $1;

-- name: CreateFoodEntry :one
insert into food_entries (food_id, name, quantity, calories, protein, carbs, fat, date)
values ($1, $2, $3, $4, $5, $6, $7, $8)
returning *;

-- name: UpdateFoodEntryQuantity :one
update food_entries
set quantity = $2, calories = $3, protein = $4, carbs = $5, fat = $6
where id = $1
returning *;

-- name: DeleteFoodEntry :exec
delete from food_entries
where id = $1;
