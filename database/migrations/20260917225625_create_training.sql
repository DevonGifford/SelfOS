-- +goose Up
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('strength', 'cardio')),
  workout_type text not null check (workout_type in ('push', 'pull', 'legs', 'cardio')),
  created_at timestamptz not null default now()
);

create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workout_type text not null check (workout_type in ('push', 'pull', 'legs', 'cardio')),
  is_default boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workout_type, name)
);

create unique index workout_templates_one_default_per_type
  on workout_templates (workout_type)
  where is_default = true;

create table workout_template_sets (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  exercise_name text not null,
  position integer not null,
  set_type text not null default 'working' check (set_type in ('warmup', 'working', 'failure', 'drop')),
  weight_kg numeric,
  reps integer,
  duration_sec integer,
  distance_m numeric,
  created_at timestamptz not null default now()
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_type text not null check (workout_type in ('push', 'pull', 'legs', 'cardio', 'freestyle')),
  template_id uuid references workout_templates(id) on delete set null,
  note text,
  date date not null,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  exercise_name text not null,
  note text,
  position integer not null,
  created_at timestamptz not null default now()
);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references workout_session_exercises(id) on delete cascade,
  set_type text not null default 'working' check (set_type in ('warmup', 'working', 'failure', 'drop')),
  confirmed boolean not null default false,
  note text,
  weight_kg numeric,
  reps integer,
  duration_sec integer,
  distance_m numeric,
  created_at timestamptz not null default now()
);

create index workout_sessions_workout_type_date_idx on workout_sessions (workout_type, date desc, created_at desc);
create index workout_session_exercises_session_id_idx on workout_session_exercises (session_id, position);
create index workout_sets_session_exercise_id_idx on workout_sets (session_exercise_id, created_at desc);
create index workout_template_sets_template_id_idx on workout_template_sets (template_id, position);

-- +goose Down
drop table workout_sets;
drop table workout_session_exercises;
drop table workout_sessions;
drop table workout_template_sets;
drop table workout_templates;
drop table exercises;
