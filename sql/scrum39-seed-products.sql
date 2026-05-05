-- SCRUM-39: Seed product data from client-provided spreadsheet
-- Source: Flooring_Specifications.xlsx
-- 22 products across 6 brands, 54 total variants

BEGIN;

-- ─── Products (one per Range) ────────────────────────────
INSERT INTO products (slug, category_id, name, brand, description, is_active) VALUES
    ('fiddleback', (SELECT id FROM categories WHERE slug = 'hardwood'), 'Fiddleback', 'Preference Floors', 'Fiddleback range by Preference Floors. Blackbutt species. Floating or glue down installation.', true),
    ('godfrey-hirst-corsica-oak', (SELECT id FROM categories WHERE slug = 'hardwood'), 'Godfrey Hirst Corsica Oak', 'Godfrey Hirst', 'Godfrey Hirst Corsica Oak range by Godfrey Hirst. European Oak species. Floating or glue down installation.', true),
    ('genuine-oak', (SELECT id FROM categories WHERE slug = 'hardwood'), 'Genuine Oak', 'Hurford Flooring', 'Genuine Oak range by Hurford Flooring. European Oak species.', true),
    ('quick-step-readyflor', (SELECT id FROM categories WHERE slug = 'hardwood'), 'Quick-Step ReadyFlor', 'Quick-Step', 'Quick-Step ReadyFlor range by Quick-Step. Blackbutt species. Floating or glue down installation.', true),
    ('aspire', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Aspire', 'Preference Floors', 'Aspire range by Preference Floors. European Oak species. Floating installation.', true),
    ('godfrey-hirst-zenith-1806', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Godfrey Hirst Zenith 1806', 'Godfrey Hirst', 'Godfrey Hirst Zenith 1806 range by Godfrey Hirst. European Oak species.', true),
    ('godfrey-hirst-zenith-1807', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Godfrey Hirst Zenith 1807', 'Godfrey Hirst', 'Godfrey Hirst Zenith 1807 range by Godfrey Hirst. European Oak species.', true),
    ('godfrey-hirst-zenith-1808', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Godfrey Hirst Zenith 1808', 'Godfrey Hirst', 'Godfrey Hirst Zenith 1808 range by Godfrey Hirst. European Oak species.', true),
    ('karndean-korlok-wood', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Karndean Korlok Wood', 'Karndean', 'Karndean Korlok Wood range by Karndean. European Oak species. Floating installation.', true),
    ('quick-step-bloom', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Quick-Step Bloom', 'Quick-Step', 'Quick-Step Bloom range by Quick-Step. European Oak species. Floating installation.', true),
    ('quick-step-ciro', (SELECT id FROM categories WHERE slug = 'hybrid'), 'Quick-Step Ciro', 'Quick-Step', 'Quick-Step Ciro range by Quick-Step. European Oak species. Floating installation.', true),
    ('aspect', (SELECT id FROM categories WHERE slug = 'laminate'), 'Aspect', 'Preference Floors', 'Aspect range by Preference Floors. European Oak species. Floating installation.', true),
    ('aspect-longboard', (SELECT id FROM categories WHERE slug = 'laminate'), 'Aspect Longboard', 'Preference Floors', 'Aspect Longboard range by Preference Floors. European Oak species. Floating installation.', true),
    ('godfrey-hirst-amor-classic', (SELECT id FROM categories WHERE slug = 'laminate'), 'Godfrey Hirst Amor Classic', 'Godfrey Hirst', 'Godfrey Hirst Amor Classic range by Godfrey Hirst. European Oak species.', true),
    ('quick-step-impressive', (SELECT id FROM categories WHERE slug = 'laminate'), 'Quick-Step Impressive', 'Quick-Step', 'Quick-Step Impressive range by Quick-Step. European Oak species. Floating installation.', true),
    ('ultimo-45mm', (SELECT id FROM categories WHERE slug = 'vinyl-plank'), 'Ultimo 4.5mm', 'Preference Floors', 'Ultimo 4.5mm range by Preference Floors. European Oak species. Glue down installation.', true),
    ('hurford-heritage-vinyl', (SELECT id FROM categories WHERE slug = 'vinyl-plank'), 'Hurford Heritage Vinyl', 'Hurford Flooring', 'Hurford Heritage Vinyl range by Hurford Flooring. Oak species. Glue down installation.', true),
    ('resiplank-adore-507', (SELECT id FROM categories WHERE slug = 'vinyl-plank'), 'Resiplank Adore 507', 'Terra Mater', 'Resiplank Adore 507 range by Terra Mater. European Oak species.', true),
    ('resiplank-adore-508', (SELECT id FROM categories WHERE slug = 'vinyl-plank'), 'Resiplank Adore 508', 'Terra Mater', 'Resiplank Adore 508 range by Terra Mater. European Oak species.', true),
    ('quick-step-fuse', (SELECT id FROM categories WHERE slug = 'vinyl-plank'), 'Quick-Step Fuse', 'Quick-Step', 'Quick-Step Fuse range by Quick-Step. European Oak species. Glue down installation.', true),
    ('quick-step-pristine-herringbone', (SELECT id FROM categories WHERE slug = 'vinyl-plank'), 'Quick-Step Pristine Herringbone', 'Quick-Step', 'Quick-Step Pristine Herringbone range by Quick-Step. European Oak species. Glue down installation.', true),
    ('pronto-oak-herringbone', (SELECT id FROM categories WHERE slug = 'hardwood'), 'Pronto Oak Herringbone', 'Preference Floors', 'Pronto Oak Herringbone range by Preference Floors. European Oak species.', true)
ON CONFLICT (slug) DO NOTHING;

-- ─── Product Variants (one per spreadsheet row) ──────────
INSERT INTO product_variants (product_id, sku, colour_name, size_label, is_active, sort_order) VALUES
    ((SELECT id FROM products WHERE slug = 'fiddleback'), 'F-SmoothBlackbutt136', 'Natural Blackbutt', '1860 × 136 × 14mm', true, 0),
    ((SELECT id FROM products WHERE slug = 'fiddleback'), 'F-SmoothSpottedGum136', 'Brown Spotted Gum', '1860 × 136 × 13mm', true, 1),
    ((SELECT id FROM products WHERE slug = 'fiddleback'), 'F-189C3-RUSTICBBT', 'Natural Blackbutt', '1860 × 189 × 14mm', true, 2),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-corsica-oak'), 'GH-0510', 'Beige European Oak', '1900 × 190 × 14mm', true, 3),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-corsica-oak'), 'GH-0180', 'Brown European Oak', '1900 × 190 × 14mm', true, 4),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-corsica-oak'), 'GH-0300', 'Natural European Oak', '1900 × 190 × 14mm', true, 5),
    ((SELECT id FROM products WHERE slug = 'genuine-oak'), 'GEOAS1901419', 'White European Oak', '1900 × 190 × 14mm', true, 6),
    ((SELECT id FROM products WHERE slug = 'genuine-oak'), 'GEOCO2401522', 'Black European Oak', '2200 × 190 × 15mm', true, 7),
    ((SELECT id FROM products WHERE slug = 'genuine-oak'), 'GEOHA2401522', 'White European Oak', '2200 × 190 × 15mm', true, 8),
    ((SELECT id FROM products WHERE slug = 'quick-step-readyflor'), 'RFS4600', 'Natural Blackbutt', '2430 × 134 × 14mm', true, 9),
    ((SELECT id FROM products WHERE slug = 'quick-step-readyflor'), 'RFS4605', 'Natural Blackbutt', '2430 × 134 × 14mm', true, 10),
    ((SELECT id FROM products WHERE slug = 'quick-step-readyflor'), 'RFS4599', 'Red Merbau', '2430 × 145 × 14mm', true, 11),
    ((SELECT id FROM products WHERE slug = 'aspire'), 'VA8-CrystalLake', 'Grey European Oak', '1800 × 223 × 8mm', true, 12),
    ((SELECT id FROM products WHERE slug = 'aspire'), 'VA8-Ironridge', 'Brown European Oak', '1800 × 223 × 8mm', true, 13),
    ((SELECT id FROM products WHERE slug = 'aspire'), 'VA8-PebbleBeach', 'Natural European Oak', '1800 × 223 × 8mm', true, 14),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-zenith-1806'), '365', 'Natural European Oak', '1800 × 225 × 10mm', true, 15),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-zenith-1807'), '795', 'Grey European Oak', '1800 × 225 × 10mm', true, 16),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-zenith-1808'), '560', 'Natural European Oak', '1800 × 225 × 10mm', true, 17),
    ((SELECT id FROM products WHERE slug = 'karndean-korlok-wood'), 'RKP8207', 'Brown Barnwood', '1420 × 225 × 6mm', true, 18),
    ((SELECT id FROM products WHERE slug = 'karndean-korlok-wood'), 'RKP8110', 'Brown European Oak', '1420 × 225 × 6mm', true, 19),
    ((SELECT id FROM products WHERE slug = 'karndean-korlok-wood'), 'RKP8248', 'Beige European Oak', '1420 × 225 × 6mm', true, 20),
    ((SELECT id FROM products WHERE slug = 'quick-step-bloom'), 'AVMPU40315', 'Brown European Oak', '1494 × 209 × 6mm', true, 21),
    ((SELECT id FROM products WHERE slug = 'quick-step-bloom'), 'AVMPU40318', 'Natural European Oak', '1494 × 209 × 6mm', true, 22),
    ((SELECT id FROM products WHERE slug = 'quick-step-bloom'), 'AVMPU40436', 'Natural European Oak', '1494 × 209 × 6mm', true, 23),
    ((SELECT id FROM products WHERE slug = 'quick-step-ciro'), 'AVHBU40362', 'Beige European Oak', '630 × 126 × 6mm', true, 24),
    ((SELECT id FROM products WHERE slug = 'quick-step-ciro'), 'AVHBU40364', 'Brown European Oak', '630 × 126 × 6mm', true, 25),
    ((SELECT id FROM products WHERE slug = 'quick-step-ciro'), 'AVHBU40363', 'Natural European Oak', '630 × 126 × 6mm', true, 26),
    ((SELECT id FROM products WHERE slug = 'aspect'), 'LAS-ALPINESNOW', 'Grey European Oak', '1518 × 236 × 12mm', true, 27),
    ((SELECT id FROM products WHERE slug = 'aspect'), 'LAS-HERONGREY', 'Brown European Oak', '1518 × 236 × 12mm', true, 28),
    ((SELECT id FROM products WHERE slug = 'aspect'), 'LAS-MOONSTONE', 'Natural European Oak', '1518 × 236 × 12mm', true, 29),
    ((SELECT id FROM products WHERE slug = 'aspect-longboard'), 'LA-ACACIA', 'Natural European Oak', '2260 × 236 × 12mm', true, 30),
    ((SELECT id FROM products WHERE slug = 'aspect-longboard'), 'LA-HAZELNUT', 'Natural European Oak', '2260 × 236 × 12mm', true, 31),
    ((SELECT id FROM products WHERE slug = 'aspect-longboard'), 'LA-HONEYBEE', 'Natural European Oak', '2260 × 236 × 12mm', true, 32),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-amor-classic'), '454453-750', 'Grey European Oak', '1200 × 190 × 8mm', true, 33),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-amor-classic'), '454453-350', 'Brown European Oak', '1200 × 190 × 8mm', true, 34),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-amor-classic'), '454453-150', 'White European Oak', '1200 × 190 × 8mm', true, 35),
    ((SELECT id FROM products WHERE slug = 'quick-step-impressive'), 'IM4446', 'Brown Spotted Gum', '1380 × 190 × 8mm', true, 36),
    ((SELECT id FROM products WHERE slug = 'quick-step-impressive'), 'IM3557', 'Beige European Oak', '1380 × 190 × 8mm', true, 37),
    ((SELECT id FROM products WHERE slug = 'quick-step-impressive'), 'IM1858', 'Grey European Oak', '1380 × 190 × 8mm', true, 38),
    ((SELECT id FROM products WHERE slug = 'ultimo-45mm'), 'VU4-Blackbutt', 'Natural Blackbutt', '1524 × 184 × 4mm', true, 39),
    ((SELECT id FROM products WHERE slug = 'ultimo-45mm'), 'VU4-Toledo', 'Black European Oak', '1524 × 229 × 4mm', true, 40),
    ((SELECT id FROM products WHERE slug = 'ultimo-45mm'), 'VU4-Cordoba', 'White European Oak', '1524 × 229 × 4mm', true, 41),
    ((SELECT id FROM products WHERE slug = 'hurford-heritage-vinyl'), 'HURHLVCAR', 'Natural Oak', '1524 × 228 × 4mm', true, 42),
    ((SELECT id FROM products WHERE slug = 'hurford-heritage-vinyl'), 'HURHLVMI', 'Beige Oak', '1524 × 228 × 4mm', true, 43),
    ((SELECT id FROM products WHERE slug = 'hurford-heritage-vinyl'), 'HURHLVWH', 'Natural Oak', '1524 × 228 × 4mm', true, 44),
    ((SELECT id FROM products WHERE slug = 'resiplank-adore-507'), '309-24', 'Natural European Oak', '1505 × 5mm', true, 45),
    ((SELECT id FROM products WHERE slug = 'resiplank-adore-507'), '309-21', 'Brown Spotted Gum', '1505 × 5mm', true, 46),
    ((SELECT id FROM products WHERE slug = 'resiplank-adore-508'), '309-19', 'Natural European Oak', '1505 × 5mm', true, 47),
    ((SELECT id FROM products WHERE slug = 'quick-step-fuse'), 'SGMPC20330', 'Brown European Oak', '1500 × 228 × 2mm', true, 48),
    ((SELECT id FROM products WHERE slug = 'quick-step-pristine-herringbone'), 'SGMPC20329', 'Natural European Oak', '1500 × 228 × 2mm', true, 49),
    ((SELECT id FROM products WHERE slug = 'quick-step-fuse'), 'SGMPC20328', 'Natural European Oak', '1500 × 228 × 2mm', true, 50),
    ((SELECT id FROM products WHERE slug = 'pronto-oak-herringbone'), 'OPH-PARQ-MISTY-COVE', 'Natural European Oak', '600 × 120 × 14mm', true, 51),
    ((SELECT id FROM products WHERE slug = 'pronto-oak-herringbone'), 'OPH-PARQ-PARCHMENT', 'Grey European Oak', '600 × 120 × 14mm', true, 52),
    ((SELECT id FROM products WHERE slug = 'pronto-oak-herringbone'), 'OPH-PARQ-CHESTERFIELD', 'Beige European Oak', '600 × 120 × 14mm', true, 53)
ON CONFLICT (sku) DO NOTHING;

-- ─── Product Attributes (derived from spreadsheet) ───────
INSERT INTO product_attributes (product_id, attribute_id, value) VALUES
    ((SELECT id FROM products WHERE slug = 'fiddleback'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'false'),
    ((SELECT id FROM products WHERE slug = 'fiddleback'), (SELECT id FROM attributes WHERE slug = 'low-voc'), 'true'),
    ((SELECT id FROM products WHERE slug = 'fiddleback'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating or glue down'),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-corsica-oak'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'false'),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-corsica-oak'), (SELECT id FROM attributes WHERE slug = 'low-voc'), 'true'),
    ((SELECT id FROM products WHERE slug = 'godfrey-hirst-corsica-oak'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating or glue down'),
    ((SELECT id FROM products WHERE slug = 'quick-step-readyflor'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'false'),
    ((SELECT id FROM products WHERE slug = 'quick-step-readyflor'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating or glue down'),
    ((SELECT id FROM products WHERE slug = 'aspire'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'aspire'), (SELECT id FROM attributes WHERE slug = 'low-voc'), 'true'),
    ((SELECT id FROM products WHERE slug = 'aspire'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'karndean-korlok-wood'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'karndean-korlok-wood'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'quick-step-bloom'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'quick-step-bloom'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'quick-step-ciro'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'quick-step-ciro'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'aspect'), (SELECT id FROM attributes WHERE slug = 'low-voc'), 'true'),
    ((SELECT id FROM products WHERE slug = 'aspect'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'aspect-longboard'), (SELECT id FROM attributes WHERE slug = 'low-voc'), 'true'),
    ((SELECT id FROM products WHERE slug = 'aspect-longboard'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'quick-step-impressive'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'quick-step-impressive'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Floating'),
    ((SELECT id FROM products WHERE slug = 'ultimo-45mm'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'ultimo-45mm'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Glue down'),
    ((SELECT id FROM products WHERE slug = 'hurford-heritage-vinyl'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'hurford-heritage-vinyl'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Glue down'),
    ((SELECT id FROM products WHERE slug = 'resiplank-adore-507'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'resiplank-adore-508'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'quick-step-fuse'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'quick-step-fuse'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Glue down'),
    ((SELECT id FROM products WHERE slug = 'quick-step-pristine-herringbone'), (SELECT id FROM attributes WHERE slug = 'waterproof'), 'true'),
    ((SELECT id FROM products WHERE slug = 'quick-step-pristine-herringbone'), (SELECT id FROM attributes WHERE slug = 'install-method'), 'Glue down')
ON CONFLICT (product_id, attribute_id) DO NOTHING;

COMMIT;

-- Verification queries:
-- SELECT count(*) FROM products;            -- expect 22
-- SELECT count(*) FROM product_variants;    -- expect 54
-- SELECT count(*) FROM product_attributes;  -- depends on data coverage