# Database Migrations & Seed Scripts

This folder contains all SQL migrations and seed scripts for the Empirical Flooring backend.

## How to apply

Migrations are applied through the Supabase dashboard SQL Editor:

1. Open the Supabase project dashboard
2. Navigate to **SQL Editor** → **New query**
3. Paste the contents of the file
4. Click **Run**
5. Verify in **Table Editor** that the expected schema/data appears

All SQL files are idempotent (use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP IF EXISTS`) so re-running them is safe.

## File order

Files should be applied in this order on a fresh database:

| Order | File | Purpose | Ticket |
|-------|------|---------|--------|
| 1 | `supabase-setup.sql` | Auth tables, admin profiles, shared functions | Setup |
| 2 | `scrum45-product-schema.sql` | Categories, products, variants, attributes | SCRUM-45 |
| 3 | `scrum38-qualifying-sessions.sql` | Anonymous funnel session storage | SCRUM-38 |
| 4 | `scrum42-consultation-bookings.sql` | Consultation booking submissions | SCRUM-42 |
| 5 | `scrum39-product-recommendations.sql` | Recommendation schema (new product columns + attributes) | SCRUM-39 |
| 6 | `scrum39-fix-schema.sql` | Corrective: kebab-case slugs + drop duplicate price column | SCRUM-39 |
| 7 | `scrum39-seed-products.sql` | Seed 22 products / 54 variants from client spreadsheet | SCRUM-39 / SCRUM-49 |

## Re-running on an existing database

The SQL files are idempotent, so re-running them on an existing database is safe. They will:

- Skip schema objects that already exist
- Skip data rows that already exist (matched by unique constraints like `slug` or `sku`)

If you want a clean reset, drop the Supabase project's tables manually first or use `TRUNCATE ... CASCADE` on the relevant tables.

## Seed data (`scrum39-seed-products.sql`)

### Source

Data was provided by the founder via `Flooring_Specifications.xlsx` (April 2026).

### What's seeded

- **22 products** (one per Range): Fiddleback, Genuine Oak, Quick-Step ReadyFlor, Karndean Korlok Wood, Aspect, Ultimo 4.5mm, etc.
- **54 product variants** (one per spreadsheet row), each with SKU, colour name, and size label
- **33 product attributes** derived from spreadsheet data:
  - `waterproof` — derived from "Water Resistance" column
  - `low-voc` — derived from "VOC Emission" column (≤E1, ≤E2, "free" → true)
  - `install-method` — copied from "Installation Type" column

### Categories used

- Hardwood (engineered timber and parquetry products)
- Hybrid
- Laminate
- Vinyl Plank
- Carpet (no products yet — placeholder category)

### Known data gaps

The following fields are intentionally not populated because they were missing from the source spreadsheet. They are expected to be provided by the client in future updates:

- **Prices** — `product_variants.price_per_sqm` is NULL for all variants. Budget filtering in the recommendation engine is a no-op until prices arrive.
- **Spec sheet URLs** — `products.spec_sheet_url` is NULL for all products. AC#7 of SCRUM-39 (architect path spec sheet downloads) is blocked on this.
- **Suitable rooms** — no products are tagged with `suitable-rooms`. Room-type filtering returns all products until tagged.
- **Pet/kid friendly, scratch resistant, sound absorbing** — no products are tagged with these. Lifestyle and performance filtering is partial until tagged.
- **Residential vs commercial** — all products default to `is_residential = true` and `is_commercial = false`. The architect path's commercial filter returns nothing until commercial-suitable products are flagged.
- **Durability rating** — no products are tagged. Investor-path durability filtering returns all products until tagged.

### How to refresh seed data

If the client provides an updated spreadsheet, the seed file should be regenerated rather than hand-edited. The original generation logic uses pandas to:

1. Read the .xlsx file
2. Group rows by Range (each Range becomes one product, each row becomes one variant)
3. Slugify product names using lowercase-and-hyphenate
4. Map "Product Type" column to existing category slugs
5. Derive boolean attributes (`waterproof`, `low-voc`) from text columns
6. Output a single SQL file with `INSERT ... ON CONFLICT DO NOTHING`

The generation script is not currently checked in but can be reproduced from the logic documented above.

### Verification

After running the seed, expected counts:

\`\`\`sql
SELECT
    (SELECT count(*) FROM products) AS products,
    (SELECT count(*) FROM product_variants) AS variants,
    (SELECT count(*) FROM product_attributes) AS attributes;
\`\`\`

Expected: `products = 22`, `variants = 54`, `attributes = 33` (give or take if the spreadsheet evolves).

## Conventions

- **Slugs use kebab-case** for both attributes and categories (e.g. `vinyl-plank`, `low-voc`, `install-method`)
- **Prices live on `product_variants`**, not on `products` — variants can have different prices per SKU
- **All migrations are idempotent** — safe to re-run on existing databases
- **All migrations enable RLS** with appropriate policies (public can read active records, only admins can write)