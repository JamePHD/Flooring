-- =============================================================
-- SCRUM-86: Duplicate lead detection — flag columns + email indexes
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: scrum41-quotes.sql, scrum42-consultation-bookings.sql,
--             supabase-setup.sql (admin_profiles)
-- =============================================================

-- ─── Flag columns on both lead tables ────────────────────────
-- duplicate_of_lead_type + duplicate_of_lead_id are a soft FK pointing
-- at whichever row this submission appears to duplicate. Soft (no real
-- FK constraint) because the target can live in either of two tables.

ALTER TABLE quotes
    ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS duplicate_of_lead_type TEXT
        CHECK (duplicate_of_lead_type IN ('quote', 'consultation')),
    ADD COLUMN IF NOT EXISTS duplicate_of_lead_id UUID,
    ADD COLUMN IF NOT EXISTS duplicate_dismissed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duplicate_dismissed_by UUID
        REFERENCES admin_profiles(id) ON DELETE SET NULL;

ALTER TABLE consultation_bookings
    ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS duplicate_of_lead_type TEXT
        CHECK (duplicate_of_lead_type IN ('quote', 'consultation')),
    ADD COLUMN IF NOT EXISTS duplicate_of_lead_id UUID,
    ADD COLUMN IF NOT EXISTS duplicate_dismissed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duplicate_dismissed_by UUID
        REFERENCES admin_profiles(id) ON DELETE SET NULL;

-- ─── Email indexes for fast duplicate detection ──────────────
-- Detection runs on every new submission; lower(email) lookups need
-- to be fast even on large tables.

CREATE INDEX IF NOT EXISTS idx_quotes_email_lower ON quotes(lower(email));
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_email_lower
    ON consultation_bookings(lower(email));

-- Partial index on rows that were flagged as dupes — useful for the
-- "outstanding duplicates" admin filter (when a frontend lands).
CREATE INDEX IF NOT EXISTS idx_quotes_active_duplicates
    ON quotes(created_at DESC)
    WHERE is_duplicate = true AND duplicate_dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_active_duplicates
    ON consultation_bookings(created_at DESC)
    WHERE is_duplicate = true AND duplicate_dismissed_at IS NULL;
