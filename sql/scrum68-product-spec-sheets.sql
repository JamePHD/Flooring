-- =============================================================
-- SCRUM-68: Product Spec Sheets table (multi-file)
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: scrum45-product-schema.sql (products table)
--             supabase-setup.sql (update_updated_at(), admin_profiles)
-- =============================================================

CREATE TABLE IF NOT EXISTS product_spec_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    -- storage_path is the bucket-relative path (e.g. "<productId>/<uuid>-<name>.pdf").
    -- Persisted alongside file_url so DELETE can remove the storage object without
    -- having to parse Supabase's public URL format. Not in AC#2's required column
    -- list but added for robust DELETE semantics (AC#7: "no orphan files").
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    label TEXT,
    file_size_bytes BIGINT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AC#5: list endpoint orders by sort_order; AC#2: index on product_id
CREATE INDEX IF NOT EXISTS idx_product_spec_sheets_product_id
    ON product_spec_sheets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_spec_sheets_product_sort
    ON product_spec_sheets(product_id, sort_order);

-- All reads/writes go through the service-role key (createAdminClient),
-- which bypasses RLS. Public reads happen via storage public URL (not table).
ALTER TABLE product_spec_sheets ENABLE ROW LEVEL SECURITY;

-- updated_at auto-bump (function defined in supabase-setup.sql)
DROP TRIGGER IF EXISTS product_spec_sheets_updated_at ON product_spec_sheets;
CREATE TRIGGER product_spec_sheets_updated_at
    BEFORE UPDATE ON product_spec_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
