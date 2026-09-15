-- +goose Up
create table foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serving_label text not null,
  calories_per_serving numeric not null,
  protein_per_serving numeric not null,
  carbs_per_serving numeric not null,
  fat_per_serving numeric not null,
  created_at timestamptz not null default now()
);

create table food_entries (
  id uuid primary key default gen_random_uuid(),
  food_id uuid references foods(id) on delete set null,
  name text not null,
  quantity numeric not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  date date not null,
  created_at timestamptz not null default now()
);

-- +goose Down
drop table food_entries;
drop table foods;
