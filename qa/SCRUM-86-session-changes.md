# SCRUM-86 — Duplicate lead detection

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Detect and flag duplicate lead submissions by email
(cross-table), surface the flag on the lead detail, and provide
merge + dismiss admin actions.

---

## Code changes

### `sql/scrum86-duplicate-detection.sql` — written

- Adds 5 columns to BOTH `quotes` and `consultation_bookings`:
  `is_duplicate` (default false), `duplicate_of_lead_type`,
  `duplicate_of_lead_id`, `duplicate_dismissed_at`,
  `duplicate_dismissed_by` (FK to admin_profiles)
- `(duplicate_of_lead_type, duplicate_of_lead_id)` is a soft FK — it
  can point at either table, so a real Postgres FK isn't possible.
- Two index patterns:
  - `lower(email)` indexes on both tables — duplicate detection runs on
    every submission, needs to be O(log n)
  - Partial index on `is_duplicate=true AND duplicate_dismissed_at IS NULL`
    on both tables — for an "outstanding duplicates" admin filter when
    the frontend lands

### `src/models/lead.model.ts` — additions

`Lead` interface gained the 5 flag fields. `RawQuote`/`RawBooking`
types and the `quoteToLead`/`bookingToLead` mappers updated to carry
the new columns through.

New functions:
- `findExistingLeadsByEmail(email, exclude?)` — cross-table search,
  case-insensitive, returns `ExistingLeadRef[]` ordered by `created_at`
  ASC (oldest first)
- `flagAsDuplicate(leadType, leadId, originalLeadType, originalLeadId)`
  — best-effort write to the new flag columns; logs on failure
- `detectAndFlagDuplicate({ leadType, leadId, email })` — orchestrator
  used by the create handlers. Wraps everything in try/catch so a
  failed lookup never propagates (AC#5)
- `dismissDuplicateFlag(leadType, leadId, adminId)` — clears
  `is_duplicate`, stamps `duplicate_dismissed_at` + `duplicate_dismissed_by`
- `mergeLeads({ primary, duplicate, adminId })` — re-parents notes +
  status history from duplicate → primary, writes a `to_status:
  "merged_in:<type>:<id>"` audit row, then deletes the duplicate row.
  Returns counts of moved rows.

### Controller hooks — quote.controller.ts + consultationBookingController.ts

After the existing email + HubSpot sync, both create handlers now call
`detectAndFlagDuplicate(...)`. Best-effort, never throws — submission
returns 201 regardless (AC#5).

### `src/controllers/lead.controller.ts` — additions

- `dismissDuplicateHandler(typeParam, leadId, adminId)` — validates type
  → 400, missing lead → 404
- `mergeLeadsHandler(req, adminId)` — zod schema validates the
  `{ primary: { lead_type, id }, duplicate: { lead_type, id } }` body
  shape; missing leads → 404; merge-with-self → 400

### Route handlers — new

- `src/app/api/admin/leads/[type]/[id]/dismiss-duplicate/route.ts` — POST
- `src/app/api/admin/leads/merge/route.ts` — POST

Both `withAdminAuth`. Both pass `admin.id` through for the audit trail.

---

## Database step for Alexia

Run `sql/scrum86-duplicate-detection.sql` in Supabase SQL Editor.

---

## Verification artefact

### `qa/scrum-86.http` — new

Covers:
- AC#1 + AC#2 — first quote (not flagged), second quote with same
  email (flagged, response is 201, row exists), then a cross-table
  consultation booking with same email (also flagged at the quote)
- AC#3 — admin GET on each row shows the flag fields populated
- AC#4 dismiss — without auth → 401, with auth → 200, then verify
  `is_duplicate=false` + `duplicate_dismissed_at` populated; invalid
  type → 400; missing lead → 404
- AC#4 merge — adds a note to the duplicate, runs the merge, verifies:
  - duplicate booking is gone (404)
  - the note now lives under the primary quote
  - history shows the merge audit row
- Merge edge cases — self-merge → 400, missing → 404, bad body → 400
- AC#5 — implicit; the flagging is best-effort, the original POSTs
  return 201 immediately

### Verification status

**All 5 SCRUM-86 ACs passed end-to-end on 2026-05-07.** Cross-table
detection works (quote ↔ booking), merge correctly re-parents notes
and history, dismiss stamps the audit trail, and submission timing
is unaffected by the detection step (AC#5).

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum86-duplicate-detection.sql` | new | uncommitted |
| `src/models/lead.model.ts` | added duplicate flag fields, 5 new functions | uncommitted |
| `src/controllers/quote.controller.ts` | added duplicate detection hook | uncommitted |
| `src/controllers/consultationBookingController.ts` | added duplicate detection hook | uncommitted |
| `src/controllers/lead.controller.ts` | added dismiss + merge handlers | uncommitted |
| `src/app/api/admin/leads/[type]/[id]/dismiss-duplicate/route.ts` | new | uncommitted |
| `src/app/api/admin/leads/merge/route.ts` | new | uncommitted |
| `qa/scrum-86.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-86-session-changes.md` | this document | uncommitted |
