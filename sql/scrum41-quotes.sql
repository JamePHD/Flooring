-- SCRUM-41: Quote request submissions from the funnel

create table public.quotes (
    id uuid primary key default gen_random_uuid(),

    -- Contact details (AC#1)
    full_name text not null,
    email text not null,
    phone text not null,

    -- Project details (AC#1)
    selected_products jsonb not null default '[]'::jsonb,
    square_meterage numeric(10, 2) not null,
    room_type text not null,
    project_description text not null,

    -- Contact preferences (AC#1)
    preferred_contact_method text not null,
    preferred_timeframe text not null,

    -- Investor path additions (AC#2) — nullable for non-investor paths
    num_properties integer,
    total_sqm numeric(10, 2),

    -- Session linkage (optional but useful for admin context)
    session_token uuid,
    user_path text,

    -- Admin lifecycle
    status text not null default 'pending',
    admin_notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint quotes_status_check
        check (status in ('pending', 'contacted', 'quoted', 'won', 'lost', 'expired')),
    constraint quotes_contact_method_check
        check (preferred_contact_method in ('email', 'phone', 'either')),
    constraint quotes_user_path_check
        check (user_path is null or user_path in ('diy_homeowner', 'architect_designer', 'property_investor')),
    constraint quotes_email_check
        check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    constraint quotes_square_meterage_positive
        check (square_meterage > 0),
    constraint quotes_num_properties_positive
        check (num_properties is null or num_properties > 0),
    constraint quotes_total_sqm_positive
        check (total_sqm is null or total_sqm > 0)
);

-- Most common admin queries: list pending bookings newest first, filter by path
create index quotes_status_created_at_idx
    on public.quotes (status, created_at desc);

create index quotes_user_path_idx
    on public.quotes (user_path)
    where user_path is not null;

create index quotes_session_token_idx
    on public.quotes (session_token)
    where session_token is not null;

-- updated_at trigger (reuses the function from earlier migrations)
create trigger quotes_set_updated_at
    before update on public.quotes
    for each row
    execute function public.set_updated_at();

-- RLS: backend uses service role key. No public policies = direct anon/authenticated denied.
alter table public.quotes enable row level security;

comment on table public.quotes is
    'Quote request submissions from the funnel (SCRUM-41). selected_products stores [{product_id, variant_id?}] JSONB array.';