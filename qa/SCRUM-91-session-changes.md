# SCRUM-91 — Knowledge Hub search (backend)

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Add a `?search=` query param to the public knowledge hub list
endpoint (and the admin equivalent) that does case-insensitive substring
matching across article title and body.

Most of SCRUM-91 is frontend (search input, debounce, no-page-reload,
no-results message). Backend just needs to deliver search results when
the FE asks.

---

## Code changes

### `src/models/articleModel.ts`

- `ListArticlesOptions` gained an optional `search` field.
- `listPublishedArticles` and `listAllArticles` both accept `search`
  and apply it via Supabase's `.or('title.ilike.%X%,body.ilike.%X%')`.
- User input is escaped (`%` and `,` → `\\%` / `\\,`) so a search for
  e.g. `100%` doesn't break the PostgREST filter expression.
- Body still contains HTML tags, so a search for `vinyl` matches text
  inside `<p>vinyl</p>`. Acceptable for MVP. Future improvement:
  Postgres full-text search with `tsvector` for better ranking +
  proximity.

### `src/controllers/articleController.ts`

- `listQuerySchema` extended with `search: z.string().trim().min(1).max(200).optional()`.
- Both `listArticlesPublicHandler` and `listArticlesAdminHandler` read
  the new param from the query string.
- The card view (from SCRUM-90) is unchanged — every result already
  carries `title`, `category`, `excerpt`, satisfying AC#4.

---

## Verification artefact

### `qa/scrum-91.http` — new

Seeds 3 published articles with distinct title + body terms, then runs:
- AC#2a — title-only match (`hybrid`)
- AC#2b — body-only match (`expansion`)
- AC#2c — both title + body match (`engineered`)
- AC#2d — case-insensitive (`AUSTRALIAN`)
- AC#2e/f — combined search + category filters (one narrowed match,
  one zero-results)
- AC#2g — no match → empty list, 200 (frontend uses `count===0` for
  the AC#5 no-results message)
- AC#2h — whitespace-only search → 400 (zod rejects after `.trim()`)
- Bonus — admin search verifies the same param works on the admin
  handler (admin can search drafts too)

### Verification status

**AC#2 + AC#4 verified end-to-end on 2026-05-07.** Search hits both
title and body (case-insensitive), combines with category filter, and
returns the SCRUM-90 card shape. The remaining ACs (AC#1, #3, #5, #6, #7)
are all frontend.

Note: the first seed POST in `qa/scrum-91.http` returned 400 because
the `scrum-91-hybrid` slug already existed from a previous test run
(unique constraint on `articles.slug`). The other two seeds worked and
that was enough to verify the search behaviour. To re-run cleanly,
delete the existing seed articles first via Supabase SQL Editor:
```sql
DELETE FROM articles WHERE slug LIKE 'scrum-91-%';
```

---

## AC mapping + frontend hand-off

| AC | Where |
|----|-------|
| AC#1 search input visible on hub | Frontend |
| AC#2 query title + body | Backend done — `?search=` on `GET /api/articles` |
| AC#3 update as user types / on submit | Frontend (debounce 200-300ms then call API) |
| AC#4 title, category, excerpt | Backend done (SCRUM-90 card view) |
| AC#5 no-results message | Frontend — check `response.count === 0`, render the helpful copy + category links |
| AC#6 mobile accessible | Frontend |
| AC#7 no full page reload | Frontend (use React state / Next router push or just `fetch`) |

Suggested hand-off comment:
> Backend ready. Use `GET /api/articles?search=<term>` (also accepts
> `&category=<cat>` to narrow). Each article card has `id, slug, title,
> excerpt, category, featured_image_url, published_at` (no body in the
> list response — it's stripped by SCRUM-90's `articleCardView`).
> No-results state: check `response.count === 0`. Search input value
> can be debounced before calling the API to avoid hammering on every
> keystroke (200–300ms is a sensible default).

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `src/models/articleModel.ts` | added `search` to `ListArticlesOptions` + both list functions | uncommitted |
| `src/controllers/articleController.ts` | extended `listQuerySchema` + both handlers read `search` | uncommitted |
| `qa/scrum-91.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-91-session-changes.md` | this document | uncommitted |
