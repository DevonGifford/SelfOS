-- name: GetConfiguration :one
select * from configuration
limit 1;

-- name: UpdateConfiguration :one
update configuration
set nutrition_calories_target = $1,
    nutrition_protein_target = $2,
    nutrition_carbs_target = $3,
    nutrition_fat_target = $4
returning *;
