-- +goose Up
alter table food_entries
  add column meal_slot text not null default 'breakfast'
  check (meal_slot in ('breakfast', 'snack', 'lunch', 'tea', 'dinner'));

-- +goose Down
alter table food_entries drop column meal_slot;
