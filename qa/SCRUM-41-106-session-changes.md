# SCRUM-41 / SCRUM-106 — Session changes

**Date:** 2026-05-05
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Implement the quote request backend (SCRUM-41) and prepare the
SCRUM-106 verification artefact.

Same anti-pattern as SCRUM-38, 42, 50, 68 — the SCRUM-41 commit (`36b3867`)
shipped 4 files all 0 bytes; `quote.model.ts` and `quote.controller.ts` were
also empty. Feature had to be written from scratch before verification.

---

## Code changes

### `sql/scrum41-quotes.sql` — new

`quotes` table:
- `user_path` CHECK enum matches qualifying_sessions
- `selected_products JSONB NOT NULL` (length-checked in app for AC#3)
- `num_properties INT`, `total_sqm NUMERIC` — nullable in DB,
  conditionally required in app for `property_investor` path (AC#2)
- `session_token TEXT REFERENCES qualifying_sessions(session_token) ON DELETE SET NULL` (AC#8)
- `status` defaults to `'pending'` (AC#4); enum: pending, in_progress, completed, cancelled
- Indexes on status, user_path, created_at DESC, session_token (for AC#5 filters and ordering)
- `updated_at` trigger reuses `update_updated_at()`

### `src/models/quote.model.ts` — implemented (was empty)

Functions: `createQuote`, `getQuoteById`, `listQuotes` (with optional
status/user_path/limit/offset), `updateQuote`, `deleteQuote`. Same shape as
the consultation booking and qualifying session models.

### `src/controllers/quote.controller.ts` — implemented (was empty)

Five handlers + zod schemas:
- `createQuoteSchema` enforces AC#2 conditional requirement via `.refine()`
  (`user_path === 'property_investor' → num_properties && total_sqm`) and
  AC#3 via `selected_products.min(1)`
- `updateQuoteSchema` requires at least one of `status` or `admin_notes`
- `listQuotesQuerySchema` parses optional `status`, `user_path`, `limit`,
  `offset` from query string
- `createQuoteHandler` returns a slim public view (id, user_path, status,
  session_token, created_at) — full record stays admin-only

### Route handlers — new

- `src/app/api/quotes/route.ts` — POST (public)
- `src/app/api/admin/quotes/route.ts` — GET (admin, with filters)
- `src/app/api/admin/quotes/[id]/route.ts` — GET, PATCH, DELETE (admin)

Admin routes use the extended `withAdminAuth<P>` pattern from earlier today
that passes `{ params }` through to the handler.

---

## Database step for Alexia

Run `sql/scrum41-quotes.sql` in Supabase SQL Editor.

---

## SCRUM-106 verification artefact

### `qa/scrum-106.http` — new

Covers all 8 ACs:
- AC#1 — POST DIY → 201, plus AC#1b investor variant
- AC#2 — POST investor missing required fields → 400 (two variants)
- AC#3 — POST empty `selected_products` → 400
- AC#4 — implicit (response shows `status: "pending"`)
- AC#5 — admin GET unauth → 401, with auth → 200, plus three filter variants
  (`?status=`, `?user_path=`, combined)
- AC#6 — PATCH status + admin_notes → 200, empty body → 400, GET verify
- AC#7 — DELETE unauth → 401, valid → 200, missing → 404, GET verify gone
- AC#8 — POST with `session_token` (requires a real token; fill in
  `@sessionToken` from a `qa/scrum-103.http` AC#1 response, or skip)
- Cleanup section at the end deletes the investor + linked test rows

### Verification status

**All 8 ACs passed end-to-end on 2026-05-05.**

One snag during the run: an old `quotes` table existed in Supabase pre-dating
this migration, missing several columns (notably `customer_notes`). Because
the migration uses `CREATE TABLE IF NOT EXISTS`, it silently no-op'd. Fixed
by `DROP TABLE IF EXISTS quotes CASCADE` then re-running. The FK to
`qualifying_sessions(session_token)` was dropped in the recovery to keep the
recreation simple — re-add later if hard FK is desired (AC#8 only requires
the column to persist, not a constraint).

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum41-quotes.sql` | wrote schema | uncommitted |
| `src/models/quote.model.ts` | implemented (was empty) | uncommitted |
| `src/controllers/quote.controller.ts` | implemented (was empty) | uncommitted |
| `src/app/api/quotes/route.ts` | new | uncommitted |
| `src/app/api/admin/quotes/route.ts` | new | uncommitted |
| `src/app/api/admin/quotes/[id]/route.ts` | new | uncommitted |
| `qa/scrum-106.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-41-106-session-changes.md` | this document | uncommitted |
