-- =============================================================
-- SCRUM-83: Lead status tracking — new status values, status history,
--           private notes
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: scrum41-quotes.sql, scrum42-consultation-bookings.sql,
--             supabase-setup.sql (admin_profiles)
-- =============================================================

-- ─── AC#1: Expand status enums ───────────────────────────────
-- Adds the SCRUM-83 lifecycle values (new, contacted, quote_sent,
-- closed_won, closed_lost) to both tables. Old values kept for
-- backward compatibility — the dashboard frontend can transition.

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
    CHECK (status IN (
        -- SCRUM-83 canonical lifecycle
        'new', 'contacted', 'in_progress', 'quote_sent', 'closed_won', 'closed_lost',
        -- legacy values (kept for back-compat with rows already in the DB)
        'pending', 'completed', 'cancelled', 'closed'
    ));

ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;
ALTER TABLE consultation_bookings ADD CONSTRAINT consultation_bookings_status_check
    CHECK (status IN (
        'new', 'contacted', 'in_progress', 'quote_sent', 'closed_won', 'closed_lost',
        'pending', 'confirmed', 'completed', 'cancelled', 'closed'
    ));


-- ─── AC#3: Status history table ──────────────────────────────
-- One row per status change. Append-only — never updated, only inserted.

CREATE TABLE IF NOT EXISTS lead_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_type TEXT NOT NULL CHECK (lead_type IN ('quote', 'consultation')),
    lead_id UUID NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lookup
    ON lead_status_history(lead_type, lead_id, changed_at DESC);

ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;


-- ─── AC#4: Lead notes table ──────────────────────────────────
-- Distinct from the existing single `admin_notes` text column on quotes
-- and consultation_bookings — those remain for the quick "scratchpad".
-- This table holds timestamped, multi-author private notes.

CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_type TEXT NOT NULL CHECK (lead_type IN ('quote', 'consultation')),
    lead_id UUID NOT NULL,
    body TEXT NOT NULL,
    author_id UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lookup
    ON lead_notes(lead_type, lead_id, created_at DESC);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS lead_notes_updated_at ON lead_notes;
CREATE TRIGGER lead_notes_updated_at
    BEFORE UPDATE ON lead_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
