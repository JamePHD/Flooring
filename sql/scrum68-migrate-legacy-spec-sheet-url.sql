-- =============================================================
-- SCRUM-68 (AC#1): Migrate any pre-existing products.spec_sheet_url
-- values into the new product_spec_sheets table, then drop the
-- legacy column.
--
-- Idempotent: safe to run multiple times. No-op if column doesn't exist.
-- =============================================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='products'
          AND column_name='spec_sheet_url'
    ) THEN
        -- Legacy rows have no Supabase Storage object — the PDF already
        -- lives at whatever URL was set. Allow storage_path to be NULL so
        -- migrated rows can coexist with new uploads.
        ALTER TABLE product_spec_sheets ALTER COLUMN storage_path DROP NOT NULL;

        FOR rec IN
            SELECT id, spec_sheet_url
            FROM products
            WHERE spec_sheet_url IS NOT NULL AND spec_sheet_url <> ''
        LOOP
            INSERT INTO product_spec_sheets
                (product_id, file_url, storage_path, file_name, label,
                 file_size_bytes, sort_order)
            VALUES (
                rec.id,
                rec.spec_sheet_url,
                NULL,
                COALESCE(
                    NULLIF(regexp_replace(rec.spec_sheet_url, '.*/', ''), ''),
                    'spec-sheet.pdf'
                ),
                'Specification Sheet',
                0,
                0
            );
        END LOOP;

        ALTER TABLE products DROP COLUMN spec_sheet_url;
    END IF;
END $$;
