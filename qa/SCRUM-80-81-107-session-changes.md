# SCRUM-80 / SCRUM-81 / SCRUM-107 — Session changes

**Date:** 2026-05-06
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Implement and verify transactional emails for quote and
consultation booking submissions.

Same anti-pattern as the other tickets — the SCRUM-80/81 commit
(`df7bcc2`) shipped 7 files all 0 bytes. Implementation written from
scratch using plain HTML strings (option A — agreed with Alexia in lieu
of installing React Email).

---

## Code changes

### `src/lib/email/client.ts` — new

Lazy-init `Resend` client. Returns `null` if `RESEND_API_KEY` is missing
so module load doesn't crash. Cached per-API-key.

### `src/lib/email/send.ts` — new

`sendEmail({ to, subject, html, replyTo })` — **never throws**. AC#5: a
failed send must not block submission, so all errors are caught, logged
with `[email] send failed:` or `[email] RESEND_API_KEY not configured`,
and returned as `{ ok: false, error }`. Successful sends log
`[email] sent → <to> (<subject>) id=<resend-id>` for visibility.

### `src/emails/layout.ts` — new

Shared HTML wrapper with table-based layout (Outlook desktop hostility
demands this — flexbox/grid don't work). Inline styles only (most clients
strip `<style>` blocks). Hidden preheader for inbox preview text.

### `src/emails/quoteConfirmation.ts` — new (AC#1)

Customer confirmation. Shows products count, total sqm (sum of
`quantity_sqm` or explicit `total_sqm`), num_properties for investors,
selected products list, customer notes if present.

### `src/emails/adminQuoteNotification.ts` — new (AC#2)

Admin notification with full customer + project details, product IDs in
inline `<code>` blocks, qualifying session token if linked. **`replyTo`
set to customer email** so admin can hit reply directly.

### `src/emails/consultationConfirmation.ts` — new (AC#3)

Customer confirmation with date/time **formatted**
(`Wednesday, 15 July 2026 at 2pm` rather than raw `2026-07-15 14:00`).
Falls back to raw values if formatting throws.

### `src/emails/adminBookingNotification.ts` — new (AC#4)

Admin notification with name, email (mailto link), preferred date/time,
project summary, referral source. `replyTo` set to customer email.

### `src/controllers/quote.controller.ts` — modified

After successful `createQuote()`, fires both customer and admin emails
via `sendEmail` (best-effort — failures don't block 201). Admin email
only sent if `SALES_REP_EMAIL` or `ADMIN_NOTIFICATION_EMAIL` is set.

### `src/controllers/consultationBookingController.ts` — modified

Same pattern for consultation bookings.

### `package.json`, `package-lock.json`

Added `resend@^6.12.2` (was previously imported by
`src/app/api/send-quote/route.ts` but never declared in deps — same
situation as `@supabase/supabase-js` was earlier in the week).

---

## Setup steps Alexia did

- Created Resend account, verified `lexibarbara6@gmail.com` as a recipient
- Generated API key
- Added to `.env.local`:
  ```
  RESEND_API_KEY=re_xxx
  FROM_EMAIL=onboarding@resend.dev
  SALES_REP_EMAIL=lexibarbara6@gmail.com
  ```
- Restarted dev server

---

## Verification artefact

### `qa/scrum-107.http` — new

Covers AC#1–#5 via API. Sections:
- Quote DIY submission (AC#1 + AC#2 — fires customer + admin emails)
- Quote investor variant (verifies num_properties / total_sqm in admin email)
- Consultation booking submission (AC#3 + AC#4)
- AC#5 — failure isolation. Documented procedure: temporarily set
  `RESEND_API_KEY=this_is_invalid`, restart dev, submit a request,
  verify 201 + DB row exists + server log shows `[email] send failed:`
- AC#6 / AC#7 — manual cross-client rendering and link clickability
  checks; not testable via HTTP

### Verification status

**All 7 SCRUM-107 ACs passed end-to-end on 2026-05-06.**
- AC#1–#4: emails delivered to inbox + visible in Resend Dashboard with
  correct content
- AC#5: bad API key → still 201, DB row created, server log showed
  failure but no error returned to client
- AC#6: rendering verified across email clients
- AC#7: links clickable and resolve correctly

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `package.json`, `package-lock.json` | added `resend` | uncommitted |
| `src/lib/email/client.ts` | new | uncommitted |
| `src/lib/email/send.ts` | new | uncommitted |
| `src/emails/layout.ts` | new | uncommitted |
| `src/emails/quoteConfirmation.ts` | new | uncommitted |
| `src/emails/adminQuoteNotification.ts` | new | uncommitted |
| `src/emails/consultationConfirmation.ts` | new | uncommitted |
| `src/emails/adminBookingNotification.ts` | new | uncommitted |
| `src/controllers/quote.controller.ts` | modified | uncommitted |
| `src/controllers/consultationBookingController.ts` | modified | uncommitted |
| `qa/scrum-107.http` | new test file (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-80-81-107-session-changes.md` | this document | uncommitted |
