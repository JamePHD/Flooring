-- =============================================================
-- SCRUM-69: Brands table + seed from products.brand
-- Run in Supabase Dashboard → SQL Editor
-- Idempotent: re-running won't disturb existing brand rows
-- (ON CONFLICT DO NOTHING on the seed insert).
--
-- Note: products.brand stays as a TEXT column. The brand-product link
-- is loose (text match by name). Renaming a brand here does NOT
-- cascade to products.brand. AC#9 of SCRUM-110 verifies this.
-- =============================================================

CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_sort ON brands(sort_order);

-- ─── RLS ─────────────────────────────────────────────────────
-- Service-role key (admin client) bypasses RLS.
-- Public anon key gets read access to active brands only.
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active brands" ON brands;
CREATE POLICY "Public read active brands"
    ON brands
    FOR SELECT
    USING (is_active = true);

-- updated_at auto-bump
DROP TRIGGER IF EXISTS brands_updated_at ON brands;
CREATE TRIGGER brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ─── Seed from existing products.brand values ────────────────
-- Slugify: lowercase, replace non-alphanumeric runs with '-', trim leading/trailing '-'.
INSERT INTO brands (name, slug)
SELECT
    DISTINCT brand,
    trim(both '-' from regexp_replace(lower(brand), '[^a-z0-9]+', '-', 'g'))
FROM products
WHERE brand IS NOT NULL AND brand <> ''
ON CONFLICT (slug) DO NOTHING;
