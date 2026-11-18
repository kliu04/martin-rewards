create table devices (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    key_hash text not null unique,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table devices enable row level security;
grant select, insert on table public.devices to service_role;
