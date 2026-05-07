# SCRUM-69 / SCRUM-110 — Session changes

**Date:** 2026-05-06
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Implement and verify Categories + Brands management
(CRUD, reorder, delete-blocking with force, brand seed migration).

Same 0-byte placeholder pattern — SCRUM-69 commit (`819f2ba`) shipped 8
empty files, plus pre-existing empty stubs in `categoryModel.ts` and
`categoryController.ts`. Whole feature written from scratch.

---

## Code changes

### `sql/scrum69-categories-brands.sql` — written

- `brands` table (id, name, slug UNIQUE, description, image_url, sort_order,
  is_active, timestamps + indexes + RLS policy "Public read active brands"
  + updated_at trigger)
- Seed: `INSERT INTO brands (name, slug) SELECT DISTINCT brand,
  trim(both '-' from regexp_replace(lower(brand), '[^a-z0-9]+', '-', 'g'))
  FROM products WHERE brand IS NOT NULL ON CONFLICT (slug) DO NOTHING`.
  Idempotent — re-running won't disturb existing brand rows. "Quick-Step"
  → "quick-step" matches AC#1 expectation.

### `src/models/categoryModel.ts` — implemented (was 2 bytes)

Full CRUD + reorder + count:
- `Category` interface (with meta_title / meta_description from SCRUM-51)
- `listActiveCategories` (public, sort_order asc) and `listAllCategories`
  (admin)
- `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`
- `countProductsForCategory(id)` — for AC#3 delete-blocking
- `reorderCategories([{id, sort_order}, ...])` — N parallel UPDATEs
  (small list, no need for fancier batch)

### `src/models/brandModel.ts` — implemented (was empty)

Same shape as categoryModel:
- `Brand` interface
- list (active / all), getById, create, update, delete, reorder
- `countProductsForBrand(name)` — AC#9 loose-link count, queries
  `products.brand` by **text name match** (loose link by design)
- `createBrand` maps Postgres unique-violation `23505` to a friendly
  "A brand with that slug already exists" 400 (AC#5)

### `src/controllers/categoryController.ts` — implemented (was empty)

Handlers for: list public, list admin, create, update by id, delete by id
(with `?force=true`), reorder. Slug validated as kebab-case via regex.
Update schema requires at least one field. Reorder schema: array min 1,
each item `{ id: uuid, sort_order: int >= 0 }`. AC#3 delete-block returns
`{ details: { product_count: N } }` so the frontend can show it.

### `src/controllers/brandController.ts` — implemented (was empty)

Mirror of categoryController. `deleteBrandHandler` looks up products by
`brand` *name* (current name post-rename), so a renamed brand with
products under the OLD name will appear deletable — that's the loose
link semantics per AC#9 / AC#6.

### Route handlers (6 admin + 1 public + 1 update)

- `src/app/api/admin/categories/route.ts` — GET, POST
- `src/app/api/admin/categories/[id]/route.ts` — PATCH, DELETE
- `src/app/api/admin/categories/reorder/route.ts` — PATCH
- `src/app/api/admin/brands/route.ts` — GET, POST
- `src/app/api/admin/brands/[id]/route.ts` — PATCH, DELETE
- `src/app/api/admin/brands/reorder/route.ts` — PATCH
- `src/app/api/brands/route.ts` — public GET (active only)
- `src/app/api/categories/route.ts` — switched from
  `productController.handleListCategories` to
  `categoryController.listCategoriesPublicHandler` (now returns
  `{ categories, count }` consistently)

### Cleanup

- Removed duplicate `Category` interface and `listActiveCategories` from
  `src/models/product.model.ts` — `categoryModel.ts` is the canonical
  location now. Re-export `type Category` from the old path as a soft
  shim.
- Removed `handleListCategories` from `src/controllers/productController.ts`.

---

## Database step for Alexia

Run `sql/scrum69-categories-brands.sql` in Supabase SQL Editor. Re-running
is safe (`CREATE TABLE IF NOT EXISTS` / `ON CONFLICT DO NOTHING`).

---

## Verification artefact

### `qa/scrum-110.http` — new

Covers all 9 ACs:
- AC#1 — manual SQL inspection block (column list, RLS, policy, seed count)
- AC#2 — categories CRUD: GET public/admin, POST happy + 2 missing-field
  400s, PATCH update + 404, DELETE on empty cat, DELETE non-existent
- AC#3 — category delete blocking: 400 with product_count, force=true
  succeeds, empty-cat succeeds without force
- AC#4 — category reorder: 3 throwaway cats, reverse, GET verify, empty
  array → 400, malformed item → 400
- AC#5 — brands CRUD: same shape as categories + duplicate slug → 400
- AC#6 — brand delete blocking: same shape as category, plus the loose
  link flag (deleting a brand does NOT update products.brand text)
- AC#7 — brand reorder: same shape as category reorder
- AC#8 — auth gating spot-checks (POST + reorder without auth → 401)
- AC#9 — loose link verification: create TestBrand + product, count
  blocks delete, rename brand to TestBrand2, product still has
  brand="TestBrand", force-delete succeeds

### Verification status

**All 9 SCRUM-110 ACs passed end-to-end on 2026-05-06.**

One issue found and fixed in the test artefact during the run:
- AC#7 setup blocks originally had 3 POSTs jammed under one `###` header
  with no blank line between Content-Type and body. REST Client merged
  them into a single malformed request ("Header name must be a valid HTTP
  token" error). Fixed by giving each POST its own `###` separator and
  blank line before the JSON body. Same fix applied to AC#4 setup, AC#3d,
  AC#8 blocks, and the cleanup deletes.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum69-categories-brands.sql` | wrote | uncommitted |
| `src/models/categoryModel.ts` | implemented (was empty) | uncommitted |
| `src/models/brandModel.ts` | new (commit had empty file on a different branch) | uncommitted |
| `src/models/product.model.ts` | removed duplicate Category code | uncommitted |
| `src/controllers/categoryController.ts` | implemented (was empty) | uncommitted |
| `src/controllers/brandController.ts` | new | uncommitted |
| `src/controllers/productController.ts` | removed `handleListCategories` | uncommitted |
| `src/app/api/admin/categories/route.ts` | new (GET admin, POST) | uncommitted |
| `src/app/api/admin/categories/[id]/route.ts` | new (PATCH, DELETE) | uncommitted |
| `src/app/api/admin/categories/reorder/route.ts` | new | uncommitted |
| `src/app/api/admin/brands/route.ts` | new (GET admin, POST) | uncommitted |
| `src/app/api/admin/brands/[id]/route.ts` | new (PATCH, DELETE) | uncommitted |
| `src/app/api/admin/brands/reorder/route.ts` | new | uncommitted |
| `src/app/api/brands/route.ts` | new (public GET) | uncommitted |
| `src/app/api/categories/route.ts` | switched to categoryController | uncommitted |
| `qa/scrum-110.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-69-110-session-changes.md` | this document | uncommitted |
