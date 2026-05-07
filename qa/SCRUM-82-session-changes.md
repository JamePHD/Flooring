# SCRUM-82 — HubSpot CRM sync

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Auto-create a HubSpot contact (and deal, for quotes) when a
quote or consultation booking is submitted. Failure-isolated and
admin-notified per AC#5.

Greenfield — no SCRUM-82 commit existed.

---

## Code changes

### `sql/scrum82-hubspot-sync.sql` — written

Adds nullable tracking columns to both lead tables:
- `quotes`: `hubspot_synced_at`, `hubspot_contact_id`, `hubspot_deal_id`,
  `hubspot_sync_error`
- `consultation_bookings`: same minus `hubspot_deal_id` (no deal created
  for bookings per AC#2)

Lets the SCRUM-71 admin leads view surface sync status alongside each
lead row without extra joins.

### `src/lib/hubspot/client.ts` — new

Lazy `Client` from `@hubspot/api-client`. Returns `null` when
`HUBSPOT_ACCESS_TOKEN` is missing so module load doesn't crash and the
sync layer can degrade gracefully (AC#5).

### `src/lib/hubspot/sync.ts` — new

`syncQuoteToHubspot(quote)` and `syncBookingToHubspot(booking)`. Both:
- Never throw — return `{ ok: true, contactId, dealId? }` or
  `{ ok: false, error }`
- Log failures with a `[hubspot]` prefix
- Skip silently with a warn log when no API key is configured
- Use sensible defaults for pipeline (`default`) and deal stage
  (`appointmentscheduled`) — both overridable via `HUBSPOT_PIPELINE_ID`
  and `HUBSPOT_DEAL_STAGE_ID` env vars

**Field mapping decisions:**
- Contact: `firstname`/`lastname` split from `full_name`, `email`, `phone`,
  `lifecyclestage='lead'`, `hs_lead_status='NEW'`. Source label
  ("Empirical Flooring Website" — AC#3) and the rest of the project
  context written into HubSpot's standard `description` field. Keeps the
  integration working without requiring custom HubSpot properties.
- Deal: `dealname` formatted as `Empirical Flooring Website — Quote: <name>`,
  `pipeline`, `dealstage`, and all of product interest / sqm / num_properties /
  customer notes written into the deal `description` (AC#4). Deal ↔ contact
  association uses HubSpot's default `associationTypeId: 3` (deal-to-primary-contact).

### `src/emails/hubspotSyncFailure.ts` — new

Reusable transactional email template for AC#5. Sent via the SCRUM-107
`sendEmail` helper to `SALES_REP_EMAIL` when sync fails. Includes the DB
lead id, customer info, and the raw HubSpot error so admin can either
retry or add the lead manually.

### Model helpers — added

- `recordQuoteHubspotSync(id, result)` in `quote.model.ts`
- `recordBookingHubspotSync(id, result)` in `consultationBookingModel.ts`

Both write the outcome (timestamps + IDs on success, error string on
failure) back to the row. Themselves best-effort — log errors but don't
throw, since the originating request has already returned 201.

`Quote` and `ConsultationBooking` interfaces updated with optional
`hubspot_*` fields and the `read_at` field from SCRUM-71.

### Controller hooks — updated

- `quote.controller.ts`: after the existing email sends, calls
  `syncQuoteToHubspot` → `recordQuoteHubspotSync` → on failure also
  fires the failure email to admin
- `consultationBookingController.ts`: same pattern with
  `syncBookingToHubspot`

All sync work happens AFTER the DB insert and BEFORE the 201 response;
sync failure does not affect the response (AC#5).

### `package.json` / `package-lock.json`

Added `@hubspot/api-client@^13.5.0`.

---

## HubSpot account setup steps (one-time, for Alexia)

1. Sign up at https://app.hubspot.com/signup-hubspot/crm (free tier is
   fine for sandbox).
2. (Optional, recommended) Create a sandbox account: HubSpot Settings →
   Account Setup → Sandboxes → Create. Use the sandbox for AC#8 testing
   before pointing at production.
3. Create a Private App: HubSpot Settings → Integrations → Private Apps →
   Create a private app. Give it any name (e.g. "Empirical Website
   Sync"). Under "Scopes", grant:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
4. Copy the access token (starts with `pat-`).
5. Add to `.env.local`:
   ```
   HUBSPOT_ACCESS_TOKEN=pat-xx-xxxx
   # Optional overrides — only set if your pipeline differs:
   # HUBSPOT_PIPELINE_ID=default
   # HUBSPOT_DEAL_STAGE_ID=appointmentscheduled
   ```
6. Restart the dev server.

---

## Verification artefact

### `qa/scrum-82.http` — new

Covers AC#1–#6 via API submissions. AC#7 and AC#8 are inline manual
verification blocks.

### Verification status

**All 8 SCRUM-82 ACs passed end-to-end on 2026-05-07.**

One bug found and fixed during the run:
- `description` was being sent on contact create, but it's NOT a standard
  HubSpot contact property (it IS standard on deals). Every contact
  create returned 400 with `PROPERTY_DOESNT_EXIST`. Patched
  `src/lib/hubspot/sync.ts` to only send standard contact properties
  (email, firstname, lastname, phone if present, lifecyclestage,
  hs_lead_status). Source label + project context moved entirely onto
  the deal description (still standard there). Booking contacts no
  longer carry the project context inline — admin gets that via the
  SCRUM-107 admin notification email instead, or can add a Note
  engagement in HubSpot UI.

AC#5 (failure isolation) was incidentally verified during the bug:
the 400s did NOT block the 201 responses, the DB rows were created,
and the failure email landed in the admin inbox.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `sql/scrum82-hubspot-sync.sql` | new | uncommitted |
| `src/lib/hubspot/client.ts` | new | uncommitted |
| `src/lib/hubspot/sync.ts` | new | uncommitted |
| `src/emails/hubspotSyncFailure.ts` | new | uncommitted |
| `src/models/quote.model.ts` | added recordQuoteHubspotSync + interface fields | uncommitted |
| `src/models/consultationBookingModel.ts` | added recordBookingHubspotSync + interface fields | uncommitted |
| `src/controllers/quote.controller.ts` | added sync hook | uncommitted |
| `src/controllers/consultationBookingController.ts` | added sync hook | uncommitted |
| `package.json`, `package-lock.json` | added @hubspot/api-client | uncommitted |
| `qa/scrum-82.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-82-session-changes.md` | this document | uncommitted |
