-- Initial schema draft for Sistem Manajemen Antrean

create type user_role as enum ('admin', 'staff');
create type ticket_status as enum ('waiting', 'called', 'skipped', 'completed', 'canceled');
create type queue_event_type as enum ('created', 'called', 'recalled', 'skipped', 'completed', 'canceled');

create table if not exists users (
  id uuid primary key,
  nip varchar(50) unique not null,
  full_name varchar(150) not null,
  email varchar(150) unique,
  password_hash text not null,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_categories (
  id uuid primary key,
  code varchar(20) unique not null,
  name varchar(150) not null,
  description text,
  estimated_minutes integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists counters (
  id uuid primary key,
  code varchar(50) unique not null,
  display_name varchar(120) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists counter_services (
  counter_id uuid not null references counters(id),
  service_category_id uuid not null references service_categories(id),
  primary key (counter_id, service_category_id)
);

create table if not exists tickets (
  id uuid primary key,
  ticket_number varchar(30) unique not null,
  service_category_id uuid not null references service_categories(id),
  citizen_nik varchar(30),
  status ticket_status not null default 'waiting',
  assigned_counter_id uuid references counters(id),
  called_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists queue_events (
  id uuid primary key,
  ticket_id uuid not null references tickets(id),
  event_type queue_event_type not null,
  actor_user_id uuid references users(id),
  actor_counter_id uuid references counters(id),
  note text,
  created_at timestamptz not null default now()
);
