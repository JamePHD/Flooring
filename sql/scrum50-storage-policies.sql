-- =============================================================
-- SCRUM-50: Storage bucket policies for product-spec-sheets
-- Run in Supabase Dashboard → SQL Editor AFTER you have manually
-- created the bucket via Storage UI.
--
-- Manual bucket setup steps (Supabase Dashboard → Storage):
--   1. New bucket → name: "product-spec-sheets"
--   2. Public bucket: ON
--   3. File size limit: 10 MB (10485760 bytes)
--   4. Allowed MIME types: application/pdf
--
-- The policies below enforce:
--   - public SELECT (read) on objects in this bucket (AC#1)
--   - all writes/deletes blocked at the anon-key level
--     (admin operations go through the service-role key which bypasses RLS)
-- =============================================================

-- Public read access — anyone can SELECT objects from this bucket
DROP POLICY IF EXISTS "Public read for product-spec-sheets" ON storage.objects;
CREATE POLICY "Public read for product-spec-sheets"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-spec-sheets');

-- Block anon/authenticated INSERT — only service-role bypasses this
DROP POLICY IF EXISTS "Block non-admin writes for product-spec-sheets" ON storage.objects;
CREATE POLICY "Block non-admin writes for product-spec-sheets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'product-spec-sheets' AND false);

-- Block anon/authenticated DELETE — only service-role bypasses this
DROP POLICY IF EXISTS "Block non-admin deletes for product-spec-sheets" ON storage.objects;
CREATE POLICY "Block non-admin deletes for product-spec-sheets"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'product-spec-sheets' AND false);

-- Block anon/authenticated UPDATE
DROP POLICY IF EXISTS "Block non-admin updates for product-spec-sheets" ON storage.objects;
CREATE POLICY "Block non-admin updates for product-spec-sheets"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'product-spec-sheets' AND false);
