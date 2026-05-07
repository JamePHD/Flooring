# SCRUM-72 — Knowledge Hub Articles backend

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Backend implementation only. Frontend portions (rich text
editor for AC#6, knowledge hub page for AC#4, PDP integration for AC#5,
and the admin form UI for AC#1–#3) explicitly out of scope — to be
assigned to the frontend team.

Greenfield — no SCRUM-72 commit existed; no prior article files in
`src/` or `sql/`. Implementation written from scratch.

---

## Code changes

### `sql/scrum72-articles.sql` — written

Two tables:

- **`articles`**: id, title, slug (unique), body (opaque rich-text from
  the frontend editor), category (CHECK enum: installation_guide,
  buying_guide, trends, product_comparison), featured_image_url,
  meta_title (≤ 70 chars), meta_description (≤ 200 chars), status
  (CHECK draft/published, default draft), published_at, author_id (FK
  to admin_profiles ON DELETE SET NULL), timestamps. Indexes on slug,
  status, category, and a partial index on `published_at DESC WHERE
  status='published'`. RLS: public read of published only; admin client
  bypasses via service-role key.
- **`article_product_links`**: composite PK (article_id, product_id),
  both ON DELETE CASCADE so deleting either side cleans up. `sort_order`
  per article so the frontend can render related products in a chosen
  order. RLS open for reads (visibility of the linked article is gated
  by the articles table's policy).

### `src/models/articleModel.ts` — new

- `Article` + `ArticleWithLinks` interfaces (the latter adds
  `related_product_ids: string[]` populated by a join query)
- `listPublishedArticles({ category?, limit, offset })` — public AC#4
- `getPublishedArticleBySlug(slug)` — public single article
- `listArticlesByProduct(productId)` — AC#5 reverse lookup
- `listAllArticles({ category?, status?, ... })` — admin
- `getArticleById(id)` — admin
- `createArticle(input)` — auto-stamps `published_at` when status is
  `published`
- `updateArticle(id, input, current)` — handles draft → published
  transition (sets `published_at` if not previously set), keeps
  `published_at` historical when going published → draft so the frontend
  can show "originally published on X". `related_product_ids` replaces
  the link set entirely (de-duped, sort_order set to position).
- `deleteArticle(id)` — cascade drops the join rows
- Internal `replaceProductLinks` and `attachLinks` helpers

### `src/controllers/articleController.ts` — new

Zod schemas: kebab-case slug regex, category and status enums,
related_product_ids (array of UUIDs, max 50). Update schema requires at
least one field. Public + admin handlers for list, get, create, update,
delete, publish (shortcut), unpublish (shortcut).

### Route handlers — new

Public:
- `src/app/api/articles/route.ts` — GET list (published, optional category filter)
- `src/app/api/articles/[slug]/route.ts` — GET single by slug (404 on draft)
- `src/app/api/products/[slug]/articles/route.ts` — GET articles linked
  to a product (resolves slug → product UUID via `getProductIdBySlug`
  from `productSpecSheetModel`, mirroring the spec-sheets pattern)

Admin (all `withAdminAuth`):
- `src/app/api/admin/articles/route.ts` — GET list, POST create
- `src/app/api/admin/articles/[id]/route.ts` — GET, PATCH, DELETE
- `src/app/api/admin/articles/[id]/publish/route.ts` — PATCH publish shortcut
- `src/app/api/admin/articles/[id]/unpublish/route.ts` — PATCH unpublish shortcut

---

## Database step for Alexia

Run `sql/scrum72-articles.sql` in Supabase SQL Editor.

---

## Verification artefact

### `qa/scrum-72.http` — new

Covers all backend-testable parts of AC#1–#5. AC#6 (rich text editor) is
purely frontend and not in this file. Each backend AC has explicit
positive + negative test blocks (validation rejections, draft visibility
gates, publish/unpublish round-trips, link replace semantics).

### Verification status

**Not yet run.** Awaiting:
1. SQL migration applied
2. Dev server restart (Turbopack picks up new model + controller + 8 route files)
3. Click-through

---

## Frontend hand-off — what's left for the frontend team

| AC | Backend ready | Frontend work |
|----|---------------|---------------|
| AC#1 (admin create) | POST /api/admin/articles accepts all fields | Admin form, rich text editor, image upload UI, category dropdown, related-products picker |
| AC#2 (draft/publish) | status field, /publish + /unpublish shortcuts | Draft/Publish toggle in admin form |
| AC#3 (edit/unpublish) | PATCH /api/admin/articles/[id], /unpublish | Edit page, unpublish button |
| AC#4 (knowledge hub) | GET /api/articles returns published list with category filter | `/knowledge-hub` page, category nav, article cards |
| AC#5 (related on PDP) | GET /api/products/[slug]/articles | Article carousel/list section on PDP |
| AC#6 (rich text editor) | body stored as-is (HTML) | TipTap / Lexical / similar; image upload integration; sanitisation if untrusted authors |

Suggested editor for AC#6: **TipTap** — React-friendly, headless,
supports headings/bullets/images/links out of the box, easy to
restrict to your allowed tag set.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum72-articles.sql` | new | uncommitted |
| `src/models/articleModel.ts` | new | uncommitted |
| `src/controllers/articleController.ts` | new | uncommitted |
| `src/app/api/articles/route.ts` | new | uncommitted |
| `src/app/api/articles/[slug]/route.ts` | new | uncommitted |
| `src/app/api/products/[slug]/articles/route.ts` | new | uncommitted |
| `src/app/api/admin/articles/route.ts` | new | uncommitted |
| `src/app/api/admin/articles/[id]/route.ts` | new | uncommitted |
| `src/app/api/admin/articles/[id]/publish/route.ts` | new | uncommitted |
| `src/app/api/admin/articles/[id]/unpublish/route.ts` | new | uncommitted |
| `qa/scrum-72.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-72-session-changes.md` | this document | uncommitted |
