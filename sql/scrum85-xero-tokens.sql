-- =============================================================
-- SCRUM-85: Xero OAuth token storage
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: supabase-setup.sql (admin_profiles)
--
-- One row per integration (single-tenant for MVP — see CHECK constraint
-- on `id`). Future multi-tenant support: drop the CHECK and add a
-- per-row tenant_name PK.
-- =============================================================

CREATE TABLE IF NOT EXISTS xero_tokens (
    -- Single-row enforcer: only id=1 is allowed.
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    tenant_id TEXT NOT NULL,
    tenant_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    -- Access tokens last 30 minutes; we refresh ~60s before expiry.
    expires_at TIMESTAMPTZ NOT NULL,
    -- Space-separated scope string from the token response — kept so
    -- we can detect when the connected scopes don't match what the
    -- code now requires (admin needs to reconnect).
    scope TEXT,
    connected_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    connected_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service role bypasses RLS; the table never touches anon key paths.
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS xero_tokens_updated_at ON xero_tokens;
CREATE TRIGGER xero_tokens_updated_at
    BEFORE UPDATE ON xero_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ─── quotes.xero_invoice_id (idempotency tracker) ────────────
ALTER TABLE quotes
    ADD COLUMN IF NOT EXISTS xero_invoice_id TEXT,
    ADD COLUMN IF NOT EXISTS xero_invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS xero_invoice_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS xero_invoice_created_by UUID
        REFERENCES admin_profiles(id) ON DELETE SET NULL;
