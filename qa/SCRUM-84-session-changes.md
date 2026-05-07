# SCRUM-84 — Leads search and filter

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Add search and the missing filter dimensions to the unified
admin leads endpoint.

Most of SCRUM-84 was already delivered by SCRUM-71 / verified in
SCRUM-109 (combined list with `?type`, `?status`, `?date_from/to`,
`count` field, reverse-chrono default). New backend work is just the
three additional query params: `search`, `user_path`, `product_interest`.

---

## Code changes

### `src/models/lead.model.ts`

- `ListLeadsOptions` extended with `search`, `user_path`, `product_interest`
- `listLeads` updated:
  - Setting `user_path` or `product_interest` short-circuits the bookings
    query — those columns don't exist on `consultation_bookings`, so no
    booking can ever match. Returns quotes only.
  - `search` does an `ILIKE %term%` across name + email + phone for
    quotes; name + email for bookings (no phone column on bookings).
    Implemented via Supabase `.or('full_name.ilike...,email.ilike...,phone.ilike...')`.
  - `product_interest` filter applied **in JS** after the quotes fetch,
    case-insensitive substring match against `selected_products[].name`.
    Avoids needing a custom Postgres function for JSONB-array text
    search; fine for small list sizes.
  - Search input is escaped (`%` and `,` stripped/escaped) to keep the
    PostgREST `.or()` filter expression clean and prevent injection
    into the filter syntax.

### `src/controllers/lead.controller.ts`

- `listLeadsQuerySchema` extended with the three new params:
  - `search` — trimmed string, 1-200 chars
  - `user_path` — enum (diy_homeowner / architect_designer / property_investor)
  - `product_interest` — trimmed string, 1-200 chars
- `listLeadsHandler` reads the new query params and passes through.

The `count` field already returned by the existing handler satisfies AC#4
out of the box — it reflects the post-filter result length.

---

## Verification artefact

### `qa/scrum-84.http` — new

Seeds 3 quotes (DIY/investor/architect with distinguishable product
names, phone numbers, etc.) + 1 booking, then exercises:

- AC#1 — search by name / email / phone (5 variants including no-match)
- AC#2 — user_path filter (3 valid + 1 booking-exclusion + 1 invalid → 400)
- AC#2 — product_interest filter (3 substring variants + booking-exclusion)
- AC#2 — combination of search + status + date range
- AC#2 — combination of search + user_path + product_interest
- AC#4 — count comparison: unfiltered vs filtered

### Verification status

**Verified end-to-end on 2026-05-07.** All in-scope ACs (AC#1, AC#2,
AC#4) pass. AC#3 and AC#5 remain frontend-only and outside this ticket's
backend scope.

Operational note: initial run returned 404s because Turbopack hadn't
picked up the model/controller changes. Resolved with the standard
`taskkill /PID <pid> /F` + `Remove-Item -Recurse -Force .next` + `npm run dev`
sequence.

---

## AC mapping

| AC | Where verified |
|----|----------------|
| AC#1 search by name/email/phone | New backend, AC#1a-e in `qa/scrum-84.http` |
| AC#2 type filter | Already done (SCRUM-71); AC#3 in `qa/scrum-109.http` |
| AC#2 status filter | Already done (SCRUM-71); AC#4 in `qa/scrum-109.http` |
| AC#2 date range | Already done (SCRUM-71); AC#6 in `qa/scrum-109.http` |
| AC#2 product_interest | New backend, AC#2f-i in `qa/scrum-84.http` |
| AC#2 user_path | New backend, AC#2a-e in `qa/scrum-84.http` |
| AC#3 no page reload | Frontend (out of scope for this ticket per usual split) |
| AC#4 count visible per filter | `count` field returned in every response |
| AC#5 state persists on navigation | Frontend (URL query strings) |

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `src/models/lead.model.ts` | added 3 filter options to `ListLeadsOptions` + `listLeads` impl | uncommitted |
| `src/controllers/lead.controller.ts` | extended `listLeadsQuerySchema` + handler reads new params | uncommitted |
| `qa/scrum-84.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-84-session-changes.md` | this document | uncommitted |
