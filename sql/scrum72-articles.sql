-- =============================================================
-- SCRUM-72: Knowledge Hub articles (blog) + product links
-- Run in Supabase Dashboard → SQL Editor
-- Depends on: scrum45-product-schema.sql (products), supabase-setup.sql (admin_profiles)
-- =============================================================

CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    -- Body is opaque rich-text content (HTML produced by the frontend
    -- editor for AC#6). Backend stores as-is, doesn't sanitise.
    body TEXT NOT NULL,
    category TEXT NOT NULL
        CHECK (category IN ('installation_guide', 'buying_guide', 'trends', 'product_comparison')),
    featured_image_url TEXT,
    -- SEO meta lengths match the SCRUM-51 convention (titles ≤ 70, descriptions ≤ 200)
    meta_title TEXT,
    meta_description TEXT,
    -- AC#2: draft vs published. published_at set when status flips to 'published'.
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT articles_meta_title_length
        CHECK (meta_title IS NULL OR char_length(meta_title) <= 70),
    CONSTRAINT articles_meta_description_length
        CHECK (meta_description IS NULL OR char_length(meta_description) <= 200)
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at
    ON articles(published_at DESC) WHERE status = 'published';

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public read of published articles only
DROP POLICY IF EXISTS "Public read published articles" ON articles;
CREATE POLICY "Public read published articles"
    ON articles
    FOR SELECT
    USING (status = 'published');

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ─── Article ↔ Product link table (AC#1, AC#5) ──────────────
CREATE TABLE IF NOT EXISTS article_product_links (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (article_id, product_id)
);

-- Reverse lookup: products → linked articles (for AC#5 product detail page)
CREATE INDEX IF NOT EXISTS idx_article_product_links_product
    ON article_product_links(product_id);

ALTER TABLE article_product_links ENABLE ROW LEVEL SECURITY;

-- The link rows themselves are public-readable; visibility of the underlying
-- article still gated by the articles table's RLS policy above.
DROP POLICY IF EXISTS "Public read article product links" ON article_product_links;
CREATE POLICY "Public read article product links"
    ON article_product_links
    FOR SELECT
    USING (true);
