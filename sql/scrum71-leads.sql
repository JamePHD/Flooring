-- =============================================================
-- SCRUM-71: Unified leads admin view + read tracking
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: scrum41-quotes.sql, scrum42-consultation-bookings.sql
-- =============================================================

-- ─── read_at columns ─────────────────────────────────────────
ALTER TABLE quotes
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE consultation_bookings
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- AC#5: ?unread_only=true filters by read_at IS NULL.
-- A partial index on the unread rows keeps the unread-only query fast.
CREATE INDEX IF NOT EXISTS idx_quotes_unread
    ON quotes(created_at DESC) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_bookings_unread
    ON consultation_bookings(created_at DESC) WHERE read_at IS NULL;


-- ─── AC#14: expand status enums to include in_progress + closed ─

-- Quotes: was (pending, in_progress, completed, cancelled). Add `closed`.
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'closed'));

-- Consultation bookings: was (pending, confirmed, cancelled, completed).
-- Add `in_progress` and `closed`. Keep `confirmed` since it's already in use.
ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;
ALTER TABLE consultation_bookings ADD CONSTRAINT consultation_bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'closed'));
