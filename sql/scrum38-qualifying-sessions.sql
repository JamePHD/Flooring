-- SCRUM-38: Anonymous session storage for funnel qualifying answers

create table public.qualifying_sessions (
    id uuid primary key default gen_random_uuid(),
    session_token uuid not null unique default gen_random_uuid(),
    user_path text not null,
    answers jsonb not null default '{}'::jsonb,
    is_complete boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint qualifying_sessions_user_path_check
        check (user_path in ('diy_homeowner', 'architect_designer', 'property_investor'))
);

create index qualifying_sessions_created_at_idx
    on public.qualifying_sessions (created_at);

create index qualifying_sessions_is_complete_idx
    on public.qualifying_sessions (is_complete)
    where is_complete = true;

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger qualifying_sessions_set_updated_at
    before update on public.qualifying_sessions
    for each row
    execute function public.set_updated_at();

alter table public.qualifying_sessions enable row level security;

comment on table public.qualifying_sessions is
    'Anonymous sessions storing answers from the funnel qualifying flow (SCRUM-38). Accessed via session_token by the backend.';