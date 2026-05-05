-- =============================================================
-- SCRUM-41: Quote Requests table
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: supabase-setup.sql (update_updated_at())
--             scrum38-qualifying-sessions.sql (FK target for session_token)
-- =============================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_path TEXT NOT NULL
        CHECK (user_path IN ('diy_homeowner', 'architect_designer', 'property_investor')),

    -- Contact (always required so admin can follow up)
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,

    -- AC#3: at least one product (length-checked in app, JSONB array here)
    -- Shape: [{ id: <product uuid>, name?, quantity_sqm? }, ...]
    selected_products JSONB NOT NULL,

    -- AC#2: required only when user_path = 'property_investor'.
    -- Stored nullable in DB; the app enforces conditional presence.
    num_properties INT,
    total_sqm NUMERIC,

    -- Optional free-text from the customer
    customer_notes TEXT,

    -- AC#8: optional linkage to a qualifying session
    session_token TEXT REFERENCES qualifying_sessions(session_token) ON DELETE SET NULL,

    -- Admin lifecycle
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    admin_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AC#5: admin list filters by status and user_path; ordered by created_at
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_user_path ON quotes(user_path);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_session_token ON quotes(session_token);

-- All reads/writes go through the service-role key (createAdminClient).
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS quotes_updated_at ON quotes;
CREATE TRIGGER quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
