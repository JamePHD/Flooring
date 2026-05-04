-- =============================================================
-- SCRUM-42: Consultation Bookings table
-- Run this in Supabase Dashboard → SQL Editor
-- Depends on: supabase-setup.sql (provides update_updated_at())
-- =============================================================

CREATE TABLE IF NOT EXISTS consultation_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    project_summary TEXT NOT NULL,
    referral_source TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin list view filters by status and orders by created_at
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status
    ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_created_at
    ON consultation_bookings(created_at DESC);

-- All reads/writes go through the service-role key (createAdminClient),
-- which bypasses RLS. Enable RLS so the anon key cannot touch this table
-- if it is ever used against it directly.
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;

-- Auto-bump updated_at on UPDATE (function defined in supabase-setup.sql)
DROP TRIGGER IF EXISTS consultation_bookings_updated_at ON consultation_bookings;
CREATE TRIGGER consultation_bookings_updated_at
    BEFORE UPDATE ON consultation_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
