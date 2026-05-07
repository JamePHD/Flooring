-- =============================================================
-- SCRUM-51: SEO meta fields on products and categories
-- Run in Supabase Dashboard → SQL Editor
-- Idempotent (uses IF NOT EXISTS / DROP-then-create for constraints)
-- =============================================================

-- ─── products ────────────────────────────────────────────────
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- AC#2: titles ≤ 70 chars, descriptions ≤ 200 chars
-- NULL is allowed (frontend will fall back to auto-generated values per AC#4).
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_meta_title_length;
ALTER TABLE products ADD CONSTRAINT products_meta_title_length
    CHECK (meta_title IS NULL OR char_length(meta_title) <= 70);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_meta_description_length;
ALTER TABLE products ADD CONSTRAINT products_meta_description_length
    CHECK (meta_description IS NULL OR char_length(meta_description) <= 200);


-- ─── categories ──────────────────────────────────────────────
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_meta_title_length;
ALTER TABLE categories ADD CONSTRAINT categories_meta_title_length
    CHECK (meta_title IS NULL OR char_length(meta_title) <= 70);

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_meta_description_length;
ALTER TABLE categories ADD CONSTRAINT categories_meta_description_length
    CHECK (meta_description IS NULL OR char_length(meta_description) <= 200);
