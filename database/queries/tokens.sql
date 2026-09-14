-- name: GetTokenByHash :one
select * from tokens
where token_hash = $1 and revoked_at is null;

-- name: CreateToken :one
insert into tokens (token_hash, label, scope)
values ($1, $2, $3)
returning *;

-- name: RevokeToken :exec
update tokens
set revoked_at = now()
where id = $1;
