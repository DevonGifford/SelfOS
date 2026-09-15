-- +goose Up
create table habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  position integer not null,
  created_at timestamptz not null default now()
);

create table habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id),
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- +goose Down
drop table habit_entries;
drop table habits;
