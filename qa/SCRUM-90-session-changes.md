# SCRUM-90 — Related articles on PDP (backend)

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Backend support for the PDP related-articles section. Most
ACs are frontend; backend just needs to deliver title / excerpt / link
in the right shape and cap the result at the AC#3 default of 3.

The data model, the link table, the public endpoint, and the admin
linking workflow were all delivered by SCRUM-72 yesterday. This ticket
adds the missing two pieces (excerpt + limit) and trims the response
shape.

---

## Code changes

### `src/controllers/articleController.ts`

- New helper `buildExcerpt(body, maxLength = 160)` — strips HTML tags,
  removes `<style>`/`<script>` blocks, decodes a few common entities,
  collapses whitespace, and truncates at a word boundary with `…`.
- New helper `articleCardView(article)` — projects an `ArticleWithLinks`
  to the card shape: id, slug, title, **excerpt**, category,
  featured_image_url, published_at. Crucially **drops `body`** so list
  responses stay lean (the rich-text body can be tens of KB; no point
  shipping it to a list view).
- `listArticlesPublicHandler` (knowledge hub list) — articles now mapped
  through `articleCardView`. Same shape for both `/api/articles` and
  the per-product variant.
- `getArticlePublicHandler` (single article) — still returns the full
  body, plus an extra `excerpt` field on the response (handy for OG
  meta tag generation in the frontend).
- `listArticlesForProductHandler(productId, limit?)` — now accepts an
  optional limit. Default 3 (SCRUM-90 AC#3 "up to three"). Response
  includes `count` (returned) AND `total` (linked overall) so the
  frontend can show "showing 3 of 7" if it wants.

### `src/app/api/products/[slug]/articles/route.ts`

- Reads `?limit=` from the query string with bounds checking
  (0-200, must be a number → 400 otherwise). `?limit=0` is a
  conventional "no cap" — passes 200 to the controller.
- Falls back to controller default (3) when omitted.

---

## Verification artefact

### `qa/scrum-90.http` — new

Seeds 4 published articles all linked to one product, then exercises:
- AC#3a — default returns 3 articles (count==3, total==4)
- AC#3b — excerpts are plain text (no HTML tags)
- AC#3c — `?limit=2` returns 2
- AC#3d — `?limit=0` returns all (no cap)
- AC#3e — `?limit=invalid` → 400
- AC#4 — after unlinking all articles, GET returns `{ articles: [], count: 0 }` with 200 (frontend hides section based on this)
- 404 case for non-existent product slug

### Verification status

**Not yet run.** Awaiting:
1. Dev server restart (Turbopack picks up controller + route changes)
2. Click-through

---

## AC mapping + frontend hand-off

| AC | Status |
|----|--------|
| AC#1 — display section on PDP | **Frontend** — render section using GET /api/products/[slug]/articles |
| AC#2 — links via admin CMS | ✓ done in SCRUM-72 (`PATCH /api/admin/articles/[id]` accepts `related_product_ids`) |
| AC#3 — title, excerpt, link, up to 3 | ✓ backend done. Excerpt auto-generated from body. Slug returned for the FE to build `/knowledge-hub/[slug]` href |
| AC#4 — hide if empty | **Frontend** — check `count === 0` before rendering the section |
| AC#5 — clicking navigates | **Frontend** — use Next `<Link href={`/knowledge-hub/${article.slug}`}>` |
| AC#6 — internal links for SEO | **Frontend** — same as AC#5; ensure `<Link>` (not `<a target="_blank">` or window.open) so crawlers see them as internal |

Suggested hand-off comment for the Jira ticket:
> Backend ready. Use `GET /api/products/[slug]/articles` (defaults to 3 articles, returns `{ articles, count, total }`). Each article has `id, slug, title, excerpt, category, featured_image_url, published_at` — no body in list responses. AC#4 hide-when-empty: check `response.count === 0`. AC#5/#6 link target: `/knowledge-hub/[slug]` via Next `<Link>`. Pass `?limit=N` if you want a different cap; `?limit=0` removes the cap.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `src/controllers/articleController.ts` | added excerpt helper + card view + limit param | uncommitted |
| `src/app/api/products/[slug]/articles/route.ts` | reads `?limit=` from query string | uncommitted |
| `qa/scrum-90.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-90-session-changes.md` | this document | uncommitted |
