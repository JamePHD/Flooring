-- =============================================================
-- SCRUM-38: Qualifying Sessions table
-- Run this in Supabase Dashboard → SQL Editor
-- Depends on: supabase-setup.sql (provides update_updated_at())
-- =============================================================

CREATE TABLE IF NOT EXISTS qualifying_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    user_path TEXT NOT NULL
        CHECK (user_path IN ('diy_homeowner', 'architect_designer', 'property_investor')),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Token lookups happen on every GET/PATCH against [token]
CREATE INDEX IF NOT EXISTS idx_qualifying_sessions_session_token
    ON qualifying_sessions(session_token);

-- Sessions are anonymous; the model uses the service-role key (createAdminClient)
-- which bypasses RLS. Enable RLS so the anon key cannot touch this table directly.
ALTER TABLE qualifying_sessions ENABLE ROW LEVEL SECURITY;

-- Auto-bump updated_at on UPDATE (function defined in supabase-setup.sql)
DROP TRIGGER IF EXISTS qualifying_sessions_updated_at ON qualifying_sessions;
CREATE TRIGGER qualifying_sessions_updated_at
    BEFORE UPDATE ON qualifying_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
