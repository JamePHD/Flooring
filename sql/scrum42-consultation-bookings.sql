-- SCRUM-42: Consultation booking submissions from the funnel

create table public.consultation_bookings (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    preferred_date date not null,
    preferred_time time not null,
    project_summary text not null,
    referral_source text,
    status text not null default 'pending',
    admin_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint consultation_bookings_status_check
        check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
    constraint consultation_bookings_email_check
        check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Admin dashboard will likely list by status and recency.
create index consultation_bookings_status_created_at_idx
    on public.consultation_bookings (status, created_at desc);

create index consultation_bookings_preferred_date_idx
    on public.consultation_bookings (preferred_date);

-- updated_at trigger (reusing the function created in scrum38).
-- If you didn't keep that one, uncomment the function definition below.
-- create or replace function public.set_updated_at() ...

create trigger consultation_bookings_set_updated_at
    before update on public.consultation_bookings
    for each row
    execute function public.set_updated_at();

-- RLS enabled, no public policies. Backend uses service role key.
alter table public.consultation_bookings enable row level security;

comment on table public.consultation_bookings is
    'Consultation booking requests submitted via the funnel (SCRUM-42). 15-minute sessions.';