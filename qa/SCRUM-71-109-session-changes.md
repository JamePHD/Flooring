# SCRUM-71 / SCRUM-109 — Session changes

**Date:** 2026-05-06
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Implement and verify the unified leads admin endpoint with
read tracking and expanded status values.

Same 0-byte placeholder pattern as the rest of this week's tickets —
SCRUM-71 commit (`1b75d87`) shipped 3 files all empty, plus pre-existing
empty stubs in `src/models/lead.model.ts`, `src/controllers/lead.controller.ts`,
and `src/routes/lead.routes.ts`.

---

## Code changes

### `sql/scrum71-leads.sql` — written

- Adds `read_at TIMESTAMPTZ` to both `quotes` and `consultation_bookings`
  (nullable, no default — null means unread per AC#5)
- Partial indexes on the unread rows
  (`WHERE read_at IS NULL ORDER BY created_at DESC`) so the unread-only
  query stays fast as the read-set grows
- Drops and re-creates the status CHECK constraints on both tables to
  add the new values per AC#14:
  - `quotes`: was `(pending, in_progress, completed, cancelled)`
    → adds `closed`
  - `consultation_bookings`: was `(pending, confirmed, cancelled, completed)`
    → adds `in_progress` and `closed`

### `src/models/lead.model.ts` — implemented (was empty)

- `Lead` interface — discriminated union with `lead_type: 'quote' | 'consultation'`
  and all type-specific fields nullable for the wrong type (AC#8)
- `listLeads({ type, status, unread_only, date_from, date_to, limit, offset })`
  — queries both tables in parallel, applies filters at the DB layer,
  merges results in JS, sorts by `created_at` desc, paginates (AC#1, 3, 4, 5, 6)
- `markQuoteRead(id)` / `markBookingRead(id)` — both delegate to a
  shared `markRead(table, id)`. AC#11 idempotency: existence check first;
  if `read_at` is already set, returns `{ found: true, changed: false, read_at: <existing> }`
  without modifying the row. AC#13: `{ found: false }` distinguishes
  the 404 path.

### `src/controllers/lead.controller.ts` — implemented (was empty)

- `listLeadsHandler(req)` — zod schema validates query string; AC#7
  (`date_from > date_to`) caught by a `.refine()` returning 400
- `markLeadReadHandler(typeParam, id)` — validates `typeParam` against
  `z.enum(['quote', 'consultation'])` for AC#12 (invalid type → 400),
  dispatches to the correct model function, maps `found: false` to
  404 for AC#13. Response includes `changed: boolean` so callers can
  distinguish "newly marked" from "already read"

### `src/app/api/admin/leads/route.ts` — new

GET handler wrapped with `withAdminAuth` (AC#2). Delegates to
`listLeadsHandler`.

### `src/app/api/admin/leads/[type]/[id]/read/route.ts` — new

PATCH handler wrapped with `withAdminAuth<{ type, id }>`. Awaits
params (Next.js 16 dynamic-params Promise), passes both to
`markLeadReadHandler`.

### `src/controllers/quote.controller.ts` — modified

`statusSchema` enum extended to include `closed` (AC#14).

### `src/controllers/consultationBookingController.ts` — modified

`bookingStatusSchema` enum extended to include `in_progress` and
`closed` (AC#14). Also added `id` to the booking POST response for
symmetry with the quote endpoint — needed for the chained PATCH tests
in `qa/scrum-109.http`.

### `src/models/quote.model.ts`, `src/models/consultationBookingModel.ts` — modified

`QuoteStatus` and `BookingStatus` types kept in sync with the new
zod / DB CHECK constraint values.

---

## Database step for Alexia

Run `sql/scrum71-leads.sql` in Supabase SQL Editor.

---

## Verification artefact

### `qa/scrum-109.http` — new

Covers all 14 ACs:
- Login + seed (creates one quote + one consultation lead)
- AC#2 — unauthenticated GET → 401
- AC#1 + AC#8 — combined GET, sorted desc, type-specific fields
  populated/null per `lead_type`
- AC#3a/b — `?type=quote`, `?type=consultation`
- AC#4 — `?status=pending` across both
- AC#5 — `?unread_only=true`
- AC#6a/b — date range that includes / excludes today
- AC#7 — `date_from > date_to` → 400
- AC#9 — PATCH quote/[id]/read sets `read_at`
- AC#10 — PATCH consultation/[id]/read sets `read_at`
- AC#11 — re-PATCH same lead → `changed: false`, timestamp unchanged
- AC#12 — invalid type "garbage" → 400
- AC#13a/b — non-existent quote / consultation → 404
- AC#14a-d — both new statuses (`in_progress`, `closed`) accepted on
  both `/api/admin/quotes/[id]` and `/api/admin/consultation-bookings/[id]`
- Cleanup at the end deletes seeded rows

### Verification status

**All 14 SCRUM-109 ACs passed end-to-end on 2026-05-06.** No bugs found
during the run.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum71-leads.sql` | wrote | uncommitted |
| `src/models/lead.model.ts` | implemented (was empty) | uncommitted |
| `src/controllers/lead.controller.ts` | implemented (was empty) | uncommitted |
| `src/app/api/admin/leads/route.ts` | new | uncommitted |
| `src/app/api/admin/leads/[type]/[id]/read/route.ts` | new | uncommitted |
| `src/controllers/quote.controller.ts` | added `closed` to status enum | uncommitted |
| `src/controllers/consultationBookingController.ts` | added `in_progress`, `closed` to status enum + id in POST response | uncommitted |
| `src/models/quote.model.ts` | added `closed` to `QuoteStatus` | uncommitted |
| `src/models/consultationBookingModel.ts` | added `in_progress`, `closed` to `BookingStatus` | uncommitted |
| `qa/scrum-109.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-71-109-session-changes.md` | this document | uncommitted |
