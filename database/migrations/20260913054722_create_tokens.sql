-- +goose Up
create type token_scope as enum ('read_only', 'read_write');

create table tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  label text not null,
  scope token_scope not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- +goose Down
drop table tokens;
drop type token_scope;
