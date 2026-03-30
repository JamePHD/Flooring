-- =============================================================
-- SCRUM-45: Product Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Run AFTER supabase-setup.sql (auth tables)
-- =============================================================

-- ─── Categories ──────────────────────────────────────────────
-- Flooring types: hybrid, vinyl plank, hardwood, laminate, etc.
-- Flexible — add/remove categories without schema changes

CREATE TABLE IF NOT EXISTS categories (
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

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ─── Products ────────────────────────────────────────────────
-- Base product: e.g. "Karndean Van Gogh Oak Natural"
-- One product belongs to one category
-- Variants (colours/sizes) are separate rows in product_variants

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    brand TEXT,
    description TEXT,
    short_description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);

-- ─── Product Variants ────────────────────────────────────────
-- Each product has one or more variants (colour/size combos)
-- Pricing lives here since variants can have different prices
-- SKU is the unique identifier for each variant

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    colour_name TEXT,
    colour_hex TEXT,
    size_label TEXT,
    price_per_sqm DECIMAL(10, 2),
    price_per_unit DECIMAL(10, 2),
    stock_status INT NOT NULL DEFAULT 1,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- ─── Attribute Groups ────────────────────────────────────────
-- Top-level groupings for product attributes
-- e.g. "Durability", "Installation", "Dimensions", "Appearance"

CREATE TABLE IF NOT EXISTS attribute_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Attributes ──────────────────────────────────────────────
-- Individual measurable/comparable properties within a group
-- e.g. "AC Rating" (under Durability), "Plank Width" (under Dimensions)
-- data_type tells the comparison engine how to handle the value

CREATE TABLE IF NOT EXISTS attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES attribute_groups(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    unit TEXT,
    data_type TEXT NOT NULL DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'boolean')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attributes_group ON attributes(group_id);

-- ─── Product Attributes ─────────────────────────────────────
-- Junction table linking products to their attribute values
-- Flexible: different categories can have different attributes
-- Value is stored as text — cast based on data_type when querying

CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(product_id, attribute_id)
);

CREATE INDEX idx_product_attrs_product ON product_attributes(product_id);
CREATE INDEX idx_product_attrs_attribute ON product_attributes(attribute_id);

-- ─── Updated At Triggers ─────────────────────────────────────
-- Reuse the update_updated_at() function from supabase-setup.sql

CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ──────────────────────────────────────
-- Public can read active records, only admins can write

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

-- Public read access (active records only)
CREATE POLICY "Public can view active categories"
    ON categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view active products"
    ON products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view active variants"
    ON product_variants FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view attribute groups"
    ON attribute_groups FOR SELECT
    USING (true);

CREATE POLICY "Public can view attributes"
    ON attributes FOR SELECT
    USING (true);

CREATE POLICY "Public can view product attributes"
    ON product_attributes FOR SELECT
    USING (true);

-- Admin write access (uses admin_profiles from auth setup)
CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage variants"
    ON product_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage attribute groups"
    ON attribute_groups FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage attributes"
    ON attributes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage product attributes"
    ON product_attributes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================================
-- SEED DATA: Example categories (update once client confirms)
-- =============================================================

INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Hybrid', 'hybrid', 'Waterproof hybrid flooring combining the best of laminate and vinyl', 1),
    ('Vinyl Plank', 'vinyl-plank', 'Luxury vinyl plank flooring for residential and commercial use', 2),
    ('Hardwood', 'hardwood', 'Solid and engineered hardwood timber flooring', 3),
    ('Laminate', 'laminate', 'Affordable laminate flooring with realistic wood and stone looks', 4),
    ('Carpet', 'carpet', 'Residential and commercial carpet options', 5);

-- =============================================================
-- SEED DATA: Example attribute groups and attributes
-- =============================================================

INSERT INTO attribute_groups (name, slug, sort_order) VALUES
    ('Durability', 'durability', 1),
    ('Dimensions', 'dimensions', 2),
    ('Installation', 'installation', 3),
    ('Appearance', 'appearance', 4);

-- Get group IDs for attribute inserts
WITH groups AS (
    SELECT id, slug FROM attribute_groups
)
INSERT INTO attributes (group_id, name, slug, unit, data_type, sort_order) VALUES
    ((SELECT id FROM groups WHERE slug = 'durability'), 'AC Rating', 'ac-rating', NULL, 'number', 1),
    ((SELECT id FROM groups WHERE slug = 'durability'), 'Wear Layer', 'wear-layer', 'mm', 'number', 2),
    ((SELECT id FROM groups WHERE slug = 'durability'), 'Waterproof', 'waterproof', NULL, 'boolean', 3),
    ((SELECT id FROM groups WHERE slug = 'durability'), 'Warranty', 'warranty', 'years', 'number', 4),
    ((SELECT id FROM groups WHERE slug = 'dimensions'), 'Plank Width', 'plank-width', 'mm', 'number', 1),
    ((SELECT id FROM groups WHERE slug = 'dimensions'), 'Plank Length', 'plank-length', 'mm', 'number', 2),
    ((SELECT id FROM groups WHERE slug = 'dimensions'), 'Thickness', 'thickness', 'mm', 'number', 3),
    ((SELECT id FROM groups WHERE slug = 'installation'), 'Install Method', 'install-method', NULL, 'text', 1),
    ((SELECT id FROM groups WHERE slug = 'installation'), 'Underfloor Heating', 'underfloor-heating', NULL, 'boolean', 2),
    ((SELECT id FROM groups WHERE slug = 'appearance'), 'Surface Finish', 'surface-finish', NULL, 'text', 1),
    ((SELECT id FROM groups WHERE slug = 'appearance'), 'Edge Type', 'edge-type', NULL, 'text', 2);
