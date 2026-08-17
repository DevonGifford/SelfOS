-- +goose Up
create table measurements (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  kg numeric not null,
  created_at timestamptz not null default now()
);

-- +goose Down
drop table measurements;
