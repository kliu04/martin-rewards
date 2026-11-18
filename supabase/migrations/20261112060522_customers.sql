create table customers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    stamps int not null default 0,
    created_at timestamptz not null default now()
);

alter table customers enable row level security;
grant select, insert, update, delete on table public.customers to service_role;
