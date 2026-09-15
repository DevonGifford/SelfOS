-- +goose Up
create table configuration (
  id uuid primary key default gen_random_uuid(),
  nutrition_calories_target numeric not null default 2300,
  nutrition_protein_target  numeric not null default 165,
  nutrition_carbs_target    numeric not null default 220,
  nutrition_fat_target      numeric not null default 70,
  created_at timestamptz not null default now()
);

insert into configuration default values;

-- +goose Down
drop table configuration;
