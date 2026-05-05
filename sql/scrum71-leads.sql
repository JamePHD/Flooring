-- SCRUM-71: Lead management additions for quotes and consultation bookings.
-- Adds unified status values, read tracking, and indexes for the admin leads view.

-- ─── Quotes ──────────────────────────────────────────────────

-- Add 'in_progress' and 'closed' to the existing status check constraint.
-- 'contacted' is already in the existing list.
alter table public.quotes
    drop constraint if exists quotes_status_check;

alter table public.quotes
    add constraint quotes_status_check
    check (status in (
        'pending', 'contacted', 'in_progress', 'quoted',
        'won', 'lost', 'expired', 'closed'
    ));

alter table public.quotes
    add column if not exists read_at timestamptz;

create index if not exists quotes_read_at_idx
    on public.quotes (read_at)
    where read_at is null;  -- partial: optimised for "find unread"

create index if not exists quotes_created_at_idx
    on public.quotes (created_at desc);

-- ─── Consultation Bookings ───────────────────────────────────

-- Add 'contacted', 'in_progress', and 'closed' alongside existing values.
alter table public.consultation_bookings
    drop constraint if exists consultation_bookings_status_check;

alter table public.consultation_bookings
    add constraint consultation_bookings_status_check
    check (status in (
        'pending', 'contacted', 'in_progress',
        'confirmed', 'cancelled', 'completed', 'closed'
    ));

alter table public.consultation_bookings
    add column if not exists read_at timestamptz;

create index if not exists consultation_bookings_read_at_idx
    on public.consultation_bookings (read_at)
    where read_at is null;

create index if not exists consultation_bookings_created_at_idx
    on public.consultation_bookings (created_at desc);

-- ─── Comments ────────────────────────────────────────────────

comment on column public.quotes.read_at is
    'Timestamp when admin first viewed/marked this lead as read. Null = unread (SCRUM-71 AC#6).';
comment on column public.consultation_bookings.read_at is
    'Timestamp when admin first viewed/marked this lead as read. Null = unread (SCRUM-71 AC#6).';