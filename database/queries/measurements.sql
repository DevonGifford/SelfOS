-- name: ListMeasurements :many
select * from measurements
order by date desc, created_at desc;

-- name: CreateMeasurement :one
insert into measurements (date, kg)
values ($1, $2)
returning *;

-- name: UpdateMeasurement :one
update measurements
set date = $2, kg = $3
where id = $1
returning *;

-- name: DeleteMeasurement :exec
delete from measurements
where id = $1;
