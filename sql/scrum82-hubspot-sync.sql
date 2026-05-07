-- =============================================================
-- SCRUM-82: HubSpot sync tracking columns on quotes + consultation_bookings
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: scrum41-quotes.sql, scrum42-consultation-bookings.sql
--
-- Lets the admin leads view (SCRUM-71) surface "synced to HubSpot at X /
-- failed because Y" alongside the lead row. AC#5: nullable so a failed
-- sync doesn't block insertion.
-- =============================================================

ALTER TABLE quotes
    ADD COLUMN IF NOT EXISTS hubspot_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT,
    ADD COLUMN IF NOT EXISTS hubspot_deal_id TEXT,
    ADD COLUMN IF NOT EXISTS hubspot_sync_error TEXT;

ALTER TABLE consultation_bookings
    ADD COLUMN IF NOT EXISTS hubspot_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT,
    ADD COLUMN IF NOT EXISTS hubspot_sync_error TEXT;
