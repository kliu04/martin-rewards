create table scans (
    id bigint generated always as identity primary key,
    customer_id uuid not null references customers(id) on delete cascade,
    stamps_after int not null check (stamps_after between 0 and 6),
    kind text not null check (kind in ('stamp', 'redeem')),
    created_at timestamptz not null default now()
);

create index scans_customer_time on scans (customer_id, created_at desc);

alter table scans enable row level security;
grant select, insert on table public.scans to service_role;
