# SCRUM-50 / SCRUM-68 — Session changes

**Date:** 2026-05-05
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Implement and verify the multi-file product spec sheets feature
(SCRUM-68), originally scoped as SCRUM-50 single-URL.

---

## Starting state

The "implementation" commits for both SCRUM-50 (`2636f47`) and SCRUM-68 (`7e46775`)
contained only **0-byte placeholder files** — same anti-pattern as SCRUM-38
and SCRUM-42 but at greater scale. Nothing was actually written:

- `sql/scrum50-storage-policies.sql` — empty
- `sql/scrum68-product-spec-sheets.sql` — empty
- `src/controllers/productSpecSheetController.ts` — empty
- `src/app/api/admin/products/[id]/spec-sheets/route.ts` — empty
- `src/app/api/admin/products/[id]/spec-sheets/[sheetId]/route.ts` — empty
- `src/app/api/products/[id]/spec-sheets/route.ts` — empty
- `src/models/productSpecSheetModel.ts` — did not exist at all

This QA ticket therefore could not be a *verification* — the feature had to
be written from scratch first, then verified.

---

## Code changes

### `sql/scrum68-product-spec-sheets.sql` — new

`product_spec_sheets` table per AC#2, with:
- All AC#2-required columns (`id`, `product_id` FK to products, `file_url`,
  `file_name`, `label`, `file_size_bytes`, `sort_order`, `uploaded_by`,
  `created_at`, `updated_at`)
- One **extra column** not in AC#2: `storage_path TEXT NOT NULL` — the
  bucket-relative path. Persisted alongside `file_url` so `DELETE` can remove
  the storage object reliably without parsing Supabase's public URL format.
  Required for AC#7 ("no orphan files") to be robust against URL-format
  changes. Documented in the SQL file's comments.
- FK `product_id REFERENCES products(id) ON DELETE CASCADE` for AC#8
- Indexes on `product_id` and `(product_id, sort_order)` for AC#5 ordering
- RLS enabled (admin client uses service-role key which bypasses RLS)
- `updated_at` trigger reuses `update_updated_at()` from `supabase-setup.sql`

### `sql/scrum50-storage-policies.sql` — new

RLS policies on `storage.objects` for the `product-spec-sheets` bucket:
- Public SELECT (anyone can read) — AC#1
- INSERT/UPDATE/DELETE blocked for anon/authenticated keys
  (the service-role key bypasses RLS, so admin operations still work)

The bucket itself **must be created manually** in the Supabase Storage UI —
SQL cannot create buckets. Steps documented in the file's header.

### `src/models/productSpecSheetModel.ts` — new

Constants: `SPEC_SHEET_BUCKET`, `MAX_SHEETS_PER_PRODUCT = 10`,
`MAX_FILE_SIZE_BYTES = 10 MiB`, `ALLOWED_MIME_TYPE = "application/pdf"`.

Functions:
- `getProductIdBySlug(slug)` — public route resolves slug → UUID
- `productExists(productId)` — for 404 returns
- `listSheetsByProduct(productId)` — ordered by sort_order then created_at
- `getSheetById(id)` — used by DELETE / PATCH ownership check
- `countSheetsForProduct(productId)` — for AC#4 cap check
- `uploadSheet({ productId, fileBuffer, fileName, fileSize, label, uploadedBy })` —
  uploads to storage, then inserts DB row. **Rolls back** the storage upload
  if the DB insert fails (atomic-ish, no orphan files)
- `deleteSheet(id)` — removes both storage object AND DB row (AC#7)
- `updateSheet(id, { label?, sort_order? })` — for AC#9

Filename sanitization strips path traversal and non-`[A-Za-z0-9._-]` chars,
truncates to 200 chars.

### `src/controllers/productSpecSheetController.ts` — new

Five handlers + two view helpers (`publicView`, `adminView`):
- `uploadSheetHandler(req, productId, adminId)` — multipart parse, MIME +
  size + cap + product-exists checks, then `uploadSheet`. Each AC#3 failure
  case returns its expected status (400/401/404).
- `listSheetsPublicHandler(productId)` — strips internal fields
- `listSheetsAdminHandler(productId)` — full record minus `storage_path`
- `deleteSheetHandler(productId, sheetId)` — verifies the sheet belongs to
  the product (404 otherwise) before delete
- `updateSheetHandler(req, productId, sheetId)` — zod schema requires at
  least one of `label` or `sort_order`

### `src/middleware/authMiddleware.ts` — extended (backward compatible)

`withAdminAuth` is now generic over the dynamic-route param shape and accepts
a `RouteContext<P> = { params: Promise<P> }` argument that it passes through
to the wrapped handler. Existing handlers (consultation bookings) ignore the
third argument — TypeScript allows this — so no existing code changes.

The previous workaround of extracting `id` from the URL path
(`getIdFromPath` in the consultation bookings route) is no longer required.
Existing routes still work; new routes can use the proper `params` API.

### Route handlers — new

- `src/app/api/admin/products/[id]/spec-sheets/route.ts` — POST upload, GET admin list
- `src/app/api/admin/products/[id]/spec-sheets/[sheetId]/route.ts` — DELETE, PATCH
- `src/app/api/products/[slug]/spec-sheets/route.ts` — public GET

**Path naming note:** AC#5 calls the public endpoint
`/api/products/[id]/spec-sheets`, but Next.js does not allow two different
dynamic segment names at the same level — and the existing public products
route already uses `[slug]` (`src/app/api/products/[slug]/route.ts`). The
spec endpoint is therefore mounted at `[slug]/spec-sheets/` and resolves
slug → UUID before delegating. Functionally identical from a caller POV;
just uses the slug instead of UUID in the URL.

---

## Infrastructure / database steps for Alexia

### One-time bucket creation (Supabase Dashboard → Storage)

1. **New bucket** → name: `product-spec-sheets`
2. Public bucket: **ON**
3. File size limit: **10 MB** (`10485760` bytes)
4. Allowed MIME types: `application/pdf`

### Run SQL migrations (Supabase SQL Editor)

In order:
1. `sql/scrum68-product-spec-sheets.sql` — creates the table
2. `sql/scrum50-storage-policies.sql` — applies RLS policies on the bucket

### Test product

Create at least one product to upload spec sheets against. Quick option:
```sql
INSERT INTO products (name, slug, brand)
VALUES ('QA Test Product', 'qa-test-product', 'QA')
RETURNING id, slug;
```

For the AC#4 10-file cap test, create a second product (cap test pollutes
the sheet list).

---

## SCRUM-50/68 verification artefact

### `qa/scrum-50.http` — new

REST Client file covering all 9 ACs. Layout:
- **Login** (Supabase auth direct)
- **AC#3** — 5 upload variants: no-auth → 401, valid → 201, non-PDF → 400,
  oversize → 400, missing product → 404
- **AC#5** — public GET (slug-based) and 404 for missing slug
- **AC#6** — admin GET no-auth → 401, with auth → 200
- **AC#9** — PATCH label, PATCH sort_order, PATCH empty → 400, GET verify
- **AC#7** — DELETE no-auth → 401, valid → 200, missing → 404, GET verify gone
- **AC#4** — 11 explicit upload blocks (10 succeed, 11th → 400)
- **AC#8** — manual SQL block in comments (cascade requires deleting a
  product, no admin DELETE-product endpoint exists yet)

### Test PDFs (gitignored)

- `qa/test-spec-sheet.pdf` — 299 bytes, minimal valid PDF
- `qa/test-spec-sheet-big.pdf` — ~11 MB (zero-padded with PDF header)

Generated locally; `qa/test-*.pdf` added to `.gitignore`.

### Verification status

**SCRUM-50 (9 ACs) passed end-to-end on 2026-05-05.** Bucket created, both SQL
migrations run, two test products created (`qa-test-product`, `qa-cap-test`),
all `Send Request` blocks returned the expected status codes.

One bug found and fixed during the run:
- **AC#4 cap was not enforced** — the original `countSheetsForProduct` used
  `select("*", { count: "exact", head: true })` which returned `null` for
  count in this Supabase setup, letting every upload bypass the 10-file
  guard. Replaced with `listSheetsByProduct(productId).length` check
  (cheap for max-10 rows, uses a query path we already know works). After
  fix and DB cleanup, upload 11 correctly returned 400 with the cap message.

---

## SCRUM-68 (stricter ACs) — additional work later same day

The SCRUM-68 verification ticket (separate from the SCRUM-50 one) had
stricter ACs that surfaced six gaps in the initial implementation. All
fixed and verified end-to-end on 2026-05-05.

### Code changes (round 2)

- **`sql/scrum68-migrate-legacy-spec-sheet-url.sql`** (new) — idempotent
  migration that, if `products.spec_sheet_url` exists, copies any non-null
  values into `product_spec_sheets` (label = "Specification Sheet",
  sort_order = 0) and drops the column. Also drops `NOT NULL` from
  `storage_path` so legacy rows (with no Supabase Storage object) can
  coexist with new uploads. (AC#1)
- **`src/controllers/productSpecSheetController.ts`**
  - Public + admin GET responses now include `count` field. (AC#2)
  - Label is now required, non-empty, max 100 chars. Returns 400 for
    each violation with a specific error message. (AC#4)
  - sort_order on insert is computed as `max(existing.sort_order) + 1`
    (or 0 if first). (AC#3)
- **`src/models/productSpecSheetModel.ts`**
  - Storage path changed from `{product-uuid}/{uuid}-{name}` to
    `{product-slug}/{timestamp}-{name}`. New `getProductSlugById` helper
    used by the upload handler. (AC#3)
  - `UploadSheetInput` now requires `productSlug` and `sortOrder`; `label`
    became required (no longer optional).
  - `ProductSpecSheet.storage_path` typed as `string | null` to support
    legacy migrated rows.
  - `deleteSheet` skips storage delete when `storage_path` is null
    (legacy rows have no bucket object to remove).

### New verification artefact

**`qa/scrum-68.http`** — covers all 10 SCRUM-68 ACs separately from the
looser SCRUM-50 file. Includes:
- AC#1 SQL inspection queries (manual)
- AC#2 empty-list returns `{ sheets: [], count: 0 }` (NOT 404)
- AC#3 storage path format check + sort_order auto-increment
- AC#4 six explicit validation rejections (missing file, missing label,
  empty label, label > 100 chars, non-PDF, > 10MB)
- AC#6 / AC#7 cross-product 404 protection (sheetId from product A
  queried under product B's URL → 404)
- AC#9 manual rollback test using a temporary CHECK constraint
- AC#10 singular `/spec-sheet/` (no s) endpoint returns 404

### Verification status

**All 10 SCRUM-68 ACs passed end-to-end on 2026-05-05.** No further bugs
found. Cap test, validation rejections, cross-product protection, storage
path format, sort_order auto-increment, count field, rollback cleanup,
and old-endpoint removal all behaved as specified.

---

## Pre-existing issues observed

- **Duplicate dynamic segment risk** — adding `products/[id]/spec-sheets/`
  alongside the existing `products/[slug]/route.ts` would have crashed the
  Next.js build with "different slug names for the same dynamic path".
  Worked around by mounting under `[slug]/`. Worth a note for whoever is
  consolidating the public product API.
- **Other empty admin routes** — `src/app/api/admin/products/route.ts`,
  `src/app/api/admin/products/[id]/route.ts`, attribute routes etc. are
  still 0 bytes from earlier scaffolding commits. Outside SCRUM-50/68 scope.

---

## Files touched (summary)

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum68-product-spec-sheets.sql` | wrote schema | uncommitted |
| `sql/scrum50-storage-policies.sql` | wrote RLS policies | uncommitted |
| `src/models/productSpecSheetModel.ts` | new (~180 lines) | uncommitted |
| `src/controllers/productSpecSheetController.ts` | new (~180 lines) | uncommitted |
| `src/middleware/authMiddleware.ts` | extended `withAdminAuth` (back-compat) | uncommitted |
| `src/app/api/admin/products/[id]/spec-sheets/route.ts` | new (POST + GET) | uncommitted |
| `src/app/api/admin/products/[id]/spec-sheets/[sheetId]/route.ts` | new (PATCH + DELETE) | uncommitted |
| `src/app/api/products/[slug]/spec-sheets/route.ts` | new (public GET) | uncommitted |
| `sql/scrum68-migrate-legacy-spec-sheet-url.sql` | new (round 2 — AC#1) | uncommitted |
| `.gitignore` | added `qa/test-*.pdf` | uncommitted |
| `qa/scrum-50.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/scrum-68.http` | new test file for stricter SCRUM-68 ACs (gitignored) | uncommitted, do not commit |
| `qa/test-spec-sheet.pdf`, `qa/test-spec-sheet-big.pdf` | new (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-50-68-session-changes.md` | this document | uncommitted |
