# SCRUM-94 — Article SEO + Sitemap (backend)

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Implement the dynamic sitemap.xml. Most other ACs are
frontend or admin-content responsibilities — backend already supports
the underlying fields (meta_title / meta_description from SCRUM-51,
single-article API from SCRUM-72).

---

## Code changes

### `src/app/sitemap.ts` — new

Next.js 16 native sitemap convention. Returns
`MetadataRoute.Sitemap` from a default async function; Next serves it
at `/sitemap.xml` with the right `Content-Type`.

Key decisions:
- **`export const dynamic = "force-dynamic"`** — Next caches sitemap
  output by default, which would break AC#5 ("sitemap updates
  automatically when new articles are published"). force-dynamic opts
  out and re-queries the DB on every crawler hit.
- **Base URL via env** — `NEXT_PUBLIC_SITE_URL` with localhost fallback
  for dev. Trailing slash stripped to avoid `//knowledge-hub` URLs.
- **Static + dynamic merge** — three hardcoded static entries
  (homepage, /knowledge-hub, /products) + every published article from
  the DB. The static list is a single array at the top of the file —
  one line to add a page when the FE lands.
- **`lastModified`** — articles use `updated_at` if present, else
  `published_at`, else `now()`. Crawlers use this to prioritise
  re-indexing.
- **Article URL pattern** — `${SITE_URL}/knowledge-hub/${slug}`. If the
  frontend chooses a different path (e.g. `/blog/${slug}`), one-line
  change here.
- **Limit 1000** — comfortable headroom for an MVP knowledge hub.
  Sitemap protocol allows 50,000 URLs per file; if the hub ever
  outgrows 1000, swap to Next's `generateSitemaps` for chunked sitemaps.
- **Error tolerance** — DB failure doesn't break the sitemap; the
  static entries still render and the failure is logged. Better to
  serve a partial sitemap than a 500.

---

## Verification

Hit `http://localhost:3000/sitemap.xml` after the dev server picked up
the new file. Got HTTP 200 with valid XML containing:
- 3 static entries (`/`, `/knowledge-hub`, `/products`) with correct
  `<priority>` values
- All published article entries (verified by the SCRUM-92 seed articles
  showing up under `/knowledge-hub/<slug>`)

Re-publishing or creating a new article and re-hitting the URL shows
the new article immediately — confirms AC#5.

---

## AC mapping

| AC | Status |
|----|--------|
| AC#1 — every published article has unique meta title + description | Backend supports the fields (SCRUM-51 columns + length CHECK constraints). Uniqueness is admin discipline; not enforcing as a DB constraint to avoid false positives on intentional duplicates. |
| AC#2 — consistent format `... | Empirical Flooring` | **Frontend** — render `<title>{article.meta_title || article.title} | Empirical Flooring</title>` in the article page. Backend stores the bare title; frontend appends the suffix. |
| AC#3 — SSR/SSG | **Frontend** — Next.js article page should be a server component or use `generateStaticParams`. |
| AC#4 — published article URLs in sitemap.xml | ✓ done — backend |
| AC#5 — sitemap auto-updates on new publish | ✓ done — `force-dynamic` re-queries DB each request |
| AC#6 — Open Graph tags | **Frontend** — render `<meta property="og:title">` etc. from article fields. |
| AC#7 — no 404 for valid slugs | ✓ done in SCRUM-72 (`GET /api/articles/[slug]` returns 200 for any published article) |

---

## Frontend hand-off

Suggested Jira comment when assigning the FE work:

> Backend ready:
> - Sitemap at `/sitemap.xml` lists all published articles dynamically.
> - Article data available at `GET /api/articles/[slug]` includes
>   `title`, `meta_title`, `meta_description`, `featured_image_url`,
>   `body`, `category`, `published_at`.
>
> Frontend tasks:
> - **AC#3** — make the article page a server component (or use
>   `generateStaticParams` + `generateMetadata`) so meta tags render
>   server-side for crawlers.
> - **AC#2** — `<title>{meta_title || title} | Empirical Flooring</title>`.
>   Use `meta_title` if set, else fall back to article `title`.
> - **AC#6** — `generateMetadata` should set `openGraph: { title,
>   description: meta_description, images: [featured_image_url],
>   type: 'article' }` and `twitter: { card: 'summary_large_image' }`.
> - **AC#1** — show admins a UI hint when meta is empty so they're
>   prompted to write unique copy. Backend won't block publishing
>   without meta — that's a content workflow decision.

---

## Setup step (one-time, when going live)

Add to production `.env`:
```
NEXT_PUBLIC_SITE_URL=https://www.empiricalflooring.com.au
```
(or whatever the live domain ends up being). Without it, the sitemap
defaults to `http://localhost:3000` URLs — fine for dev, not for prod.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `src/app/sitemap.ts` | new — dynamic Next.js sitemap | uncommitted |
| `qa/SCRUM-94-session-changes.md` | this document | uncommitted |

No `.http` test file for this one — `/sitemap.xml` is verified by
opening it in a browser or `curl`. There's nothing to vary across
multiple requests.
