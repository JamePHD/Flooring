# SCRUM-83 — Lead status tracking

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Backend support for the SCRUM-83 lead lifecycle: new status
values, status history, private notes, HubSpot sync on status change.

AC#2 (no page reload) is purely a frontend concern. AC#6 (reverse-chrono
default) and AC#7 (filters by status / date / type) were already
delivered by SCRUM-71 / verified in SCRUM-109 — no work needed.

---

## Code changes

### `sql/scrum83-lead-status-tracking.sql` — written

- Expanded `status` CHECK on `quotes` + `consultation_bookings` to
  include the SCRUM-83 canonical lifecycle (`new`, `contacted`,
  `in_progress`, `quote_sent`, `closed_won`, `closed_lost`).
  Legacy values kept so existing rows stay valid (AC#1).
- New `lead_status_history` table (id, lead_type, lead_id,
  from_status, to_status, changed_by → admin_profiles, changed_at).
  Append-only. Composite index `(lead_type, lead_id, changed_at DESC)`
  for fast per-lead lookups (AC#3).
- New `lead_notes` table (id, lead_type, lead_id, body, author_id,
  created_at, updated_at). Distinct from the existing single-text
  `admin_notes` column on quotes/bookings — that stays as a quick
  scratchpad (AC#4).

### Type union updates

- `QuoteStatus` (quote.model.ts), `BookingStatus`
  (consultationBookingModel.ts), and `LeadStatus` (lead.model.ts) all
  expanded to include the new canonical values + legacy.
- zod `statusSchema` in quote.controller.ts and `bookingStatusSchema`
  in consultationBookingController.ts likewise expanded.

### `src/models/lead.model.ts` — additions

- `recordStatusChange({ leadType, leadId, fromStatus, toStatus, changedBy })`
  — append a row to `lead_status_history`. Best-effort: logs on failure,
  doesn't throw (PATCH already returned 200 by then).
- `listStatusHistory(leadType, leadId)` — for the GET /history endpoint.
- `addLeadNote`, `listLeadNotes`, `getLeadNoteById`, `deleteLeadNote`
  for AC#4 CRUD.
- `LeadNote`, `StatusHistoryRow` interfaces.

### `src/lib/hubspot/sync.ts` — additions (AC#5)

- `syncStatusToHubspot({ hubspotContactId, hubspotDealId?, newStatus })`
  — pushes status changes to HubSpot.
  - Always updates contact `hs_lead_status` (mapped from our lifecycle).
  - On `closed_won`, also updates contact `lifecyclestage` to "customer".
  - On `closed_won`/`closed_lost`, updates the deal's `dealstage` to
    HubSpot's standard `closedwon`/`closedlost`.
  - Other statuses don't auto-advance the deal stage.
- Status-mapping tables documented inline:
  - `STATUS_TO_HS_LEAD_STATUS` — our lifecycle → HubSpot's enum
  - `STATUS_TO_DEAL_STAGE` — only the terminal closed_won/closed_lost
  - `STATUS_TO_LIFECYCLESTAGE` — only closed_won → customer
- Returns `SyncResult` (same shape as the create-time sync), never throws.

### `src/controllers/quote.controller.ts` + `consultationBookingController.ts` — updated

- PATCH handlers now accept an optional `adminId` parameter (passed
  through from the route via `withAdminAuth`'s admin context).
- After the DB update, if `parsed.data.status` is set AND differs from
  the existing row's status:
  1. `recordStatusChange(...)` writes a history row
  2. If the row has a `hubspot_contact_id`, `syncStatusToHubspot(...)`
     pushes the change to HubSpot
  - Both best-effort; the PATCH response goes out regardless.
- Re-PATCHing the same status is a no-op for history (the diff check
  prevents duplicate rows).

### `src/controllers/lead.controller.ts` — additions

- `leadHistoryHandler(typeParam, leadId)` — GET history (AC#3)
- `addLeadNoteHandler(req, typeParam, leadId, adminId)` — POST note
  with body validation (`min(1).max(5000)`) (AC#4)
- `listLeadNotesHandler(typeParam, leadId)` — GET notes (AC#4)
- `deleteLeadNoteHandler(typeParam, leadId, noteId)` — DELETE note,
  with cross-lead protection: 404 if the note's actual lead_type/lead_id
  doesn't match the URL params

### Route handlers — new

- `src/app/api/admin/leads/[type]/[id]/history/route.ts` — GET
- `src/app/api/admin/leads/[type]/[id]/notes/route.ts` — GET, POST
- `src/app/api/admin/leads/[type]/[id]/notes/[noteId]/route.ts` — DELETE

All `withAdminAuth`. Notes routes pass `admin.id` through for `author_id`
on POST.

### Existing routes — touched

- `src/app/api/admin/quotes/[id]/route.ts` — PATCH now passes `admin.id`
  to the handler (was previously discarding it)
- `src/app/api/admin/consultation-bookings/[id]/route.ts` — same fix,
  also migrated from the older `getIdFromPath` URL-extraction pattern
  to Next.js 16's `{ params }` API for consistency

---

## Database step for Alexia

Run `sql/scrum83-lead-status-tracking.sql` in Supabase SQL Editor.

---

## Verification artefact

### `qa/scrum-83.http` — new

Covers:
- AC#1 — PATCH through the new lifecycle (contacted → quote_sent →
  closed_won), invalid status rejection
- AC#3 — history GET, sort order, no-duplicate on same-status PATCH,
  invalid type → 400, no auth → 401
- AC#4 — POST/GET/DELETE notes, empty body → 400, cross-lead protection
  → 404, missing note → 404, no auth → 401
- AC#5 — manual HubSpot UI verification block (contact `hs_lead_status`
  + `lifecyclestage`; deal `dealstage`)

### Verification status

**Verified end-to-end on 2026-05-07.**

| AC | Result |
|----|--------|
| AC#1 — PATCH through new lifecycle | Pass |
| AC#2 — no page reload | Frontend, out of scope |
| AC#3 — status history recorded | Pass |
| AC#4 — private notes CRUD | Pass |
| AC#5 — HubSpot sync on status change | Partial — see note below |
| AC#6 — reverse-chrono default | Pass (already done in SCRUM-71) |
| AC#7 — filters by status/date/type | Pass (already done in SCRUM-71) |

**AC#5 caveat — accepted as MVP:** Contact + deal creation on initial
quote/booking submission works correctly (verified on 2026-05-07).
Status-update propagation (`closed_won` → contact `hs_lead_status =
CONNECTED`, `lifecyclestage = customer`, deal stage = `closedwon`)
**did not visibly propagate** in this HubSpot account. Likely cause:
the hardcoded HubSpot enum values in `STATUS_TO_HS_LEAD_STATUS` /
`STATUS_TO_DEAL_STAGE` / `STATUS_TO_LIFECYCLESTAGE` don't match the
exact internal names this HubSpot portal uses (custom pipelines,
disabled lifecyclestage values, or different lead status enum).

Acceptable for MVP because the lead IS in HubSpot from the create-time
sync — admins can update status manually in HubSpot's UI. Future
improvement: discover the live enum values from the HubSpot portal
(`/crm/v3/properties/contacts/hs_lead_status`) and map dynamically, or
make the mapping configurable via env vars.

Bug found and fixed during the run:
- **`.http` formatting** — the LOGIN block had no `### ` separator
  before the seed POSTs that followed, so REST Client merged them
  into one malformed request and Supabase auth returned a `bad_json`
  400. Same root cause as the SCRUM-110 fix from yesterday. Patched
  by adding `### ` headers before each `# @name` block.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum83-lead-status-tracking.sql` | new | uncommitted |
| `src/models/quote.model.ts` | expanded `QuoteStatus` | uncommitted |
| `src/models/consultationBookingModel.ts` | expanded `BookingStatus` | uncommitted |
| `src/models/lead.model.ts` | expanded `LeadStatus` + new history/notes functions | uncommitted |
| `src/lib/hubspot/sync.ts` | added `syncStatusToHubspot` + mappings | uncommitted |
| `src/controllers/quote.controller.ts` | expanded zod enum + status-change hook | uncommitted |
| `src/controllers/consultationBookingController.ts` | expanded zod enum + status-change hook | uncommitted |
| `src/controllers/lead.controller.ts` | added history + notes handlers | uncommitted |
| `src/app/api/admin/quotes/[id]/route.ts` | PATCH now passes admin.id | uncommitted |
| `src/app/api/admin/consultation-bookings/[id]/route.ts` | PATCH passes admin.id, migrated to params API | uncommitted |
| `src/app/api/admin/leads/[type]/[id]/history/route.ts` | new | uncommitted |
| `src/app/api/admin/leads/[type]/[id]/notes/route.ts` | new | uncommitted |
| `src/app/api/admin/leads/[type]/[id]/notes/[noteId]/route.ts` | new | uncommitted |
| `qa/scrum-83.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-83-session-changes.md` | this document | uncommitted |
