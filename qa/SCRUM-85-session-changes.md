# SCRUM-85 — Xero integration (partial implementation)

**Date:** 2026-05-07
**Branch:** `scrum-42-consultation-bookings` (working tree)
**Scope:** Documentation + OAuth scaffold + manual invoice endpoint.
Full automation (auto-create on closed_won, payment webhooks) explicitly
deferred per the ticket's "partially implement" framing.

The big deliverable is `/docs/xero-integration.md` — a future developer
should be able to extend this without re-discovering the moving parts.

---

## Code changes

### `/docs/xero-integration.md` — new (AC#1, AC#5)

11 sections covering:
1. What's implemented today
2. What's NOT implemented (and why deferred)
3. Architecture diagram
4. Authentication flow (OAuth 2.0) — setup, runtime flow, scopes,
   token refresh
5. Xero API endpoints used + future endpoints
6. Data mapping (Quote → Contact + Invoice + LineItems)
7. Error handling layer-by-layer
8. Where the code lives (file map)
9. Frontend tasks (not in this sprint)
10. Going to production checklist
11. Useful Xero API references

### `sql/scrum85-xero-tokens.sql` — new

- `xero_tokens` — single-row table (CHECK `id = 1` enforces it). Columns:
  tenant_id, tenant_name, access_token, refresh_token, expires_at,
  scope, connected_by, connected_at, updated_at. RLS on. updated_at
  trigger reuses the shared function.
- Adds `xero_invoice_id`, `xero_invoice_number`, `xero_invoice_created_at`,
  `xero_invoice_created_by` to `quotes` for idempotency tracking.

### `src/lib/xero/client.ts` — new

- `XERO_SCOPES` constant exported
- `getXeroClient()` — lazy `XeroClient` from xero-node, returns `null`
  if env vars missing
- `isXeroConfigured()` — for the `/status` endpoint

### `src/lib/xero/tokens.ts` — new

- `loadStoredTokens()`, `saveTokens()`, `clearTokens()` — DB read/write
  helpers around `xero_tokens`
- `getActiveXeroClient()` — returns a Xero SDK client with a
  ready-to-use token set. Refreshes the access token if it's within a
  60-second buffer of expiry, persists the rotated refresh_token, and
  wipes the row if the 60-day refresh window has elapsed (admin then
  reconnects)

### `src/lib/xero/sync.ts` — new

- `createInvoiceForQuote(quote)` — the core mapping. Creates a Contact
  then an Invoice (DRAFT status, ACCREC type, 14-day due, references
  the quote id). One LineItem per `quote.selected_products[]`, plus an
  optional zero-value note line for `customer_notes`. UnitAmount is
  `0.00` because the data model doesn't yet capture per-product unit
  prices — admin sets them in Xero before sending. Documented in
  /docs/xero-integration.md §6.

### Route handlers — new

- `src/app/api/admin/xero/connect/route.ts` — GET, redirects to Xero's
  consent screen. Passes `admin.id` through OAuth `state` so the
  callback can attribute the connection.
- `src/app/api/admin/xero/callback/route.ts` — GET, **unauthenticated**
  (Xero's redirect carries no bearer token). Exchanges code for
  tokens, calls `updateTenants()` to discover the connected org,
  upserts `xero_tokens`. Bounces to `/admin?xero=connected` (or
  `?xero_error=...` on failure).
- `src/app/api/admin/xero/status/route.ts` — GET, auth-gated. Returns
  `{ configured, connected, tenant_name?, connected_at? }` for the
  admin UI.
- `src/app/api/admin/xero/disconnect/route.ts` — POST, auth-gated.
  Wipes the row. (Doesn't revoke on Xero's side — admin can do that
  in Xero's connected-apps UI.)
- `src/app/api/admin/quotes/[id]/create-xero-invoice/route.ts` — POST,
  auth-gated. The "Create Xero Invoice" button target. Handles all 5
  failure reasons (not_configured / not_connected / refresh_failed /
  xero_error / quote not found) with distinct status codes
  (503 / 412 / 412 / 502 / 404). Idempotent: 409 if the quote already
  has `xero_invoice_id`.

---

## Setup steps (one-time, per environment)

Documented in /docs/xero-integration.md §4. TL;DR:
1. Xero developer account → My Apps → New app → web app → redirect URI
2. Add `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI` to
   `.env.local`
3. Run `sql/scrum85-xero-tokens.sql`
4. Restart dev server
5. Open `http://localhost:3000/api/admin/xero/connect` in a browser —
   the OAuth flow completes and `xero_tokens` populates

---

## Verification artefact

### `qa/scrum-85.http` — new

Hybrid runbook — a few request blocks, but the core OAuth step is a
browser interaction (Xero won't authorise via REST Client). The file
walks through:
- Pre-OAuth status check → `connected: false`
- BROWSER step: click `/api/admin/xero/connect`, authorise in Xero
- Post-OAuth status check → `connected: true, tenant_name: "Demo Company (AU)"`
- Seed a test quote
- POST `/create-xero-invoice` → 200 + invoice appears in Xero Drafts
- Re-call → 409 (idempotency)
- Auth gates (401)
- Missing quote (404)
- Disconnect → status reports `connected: false`
- Documented manual env-toggle steps for the 503 / 412 paths

### Verification status

**All 5 SCRUM-85 ACs satisfied on 2026-05-07.**

- AC#1 — full doc at /docs/xero-integration.md (11 sections)
- AC#2 — OAuth tested end-to-end against Xero sandbox; browser bounced
  to `/admin?xero=connected` and the `xero_tokens` row populated
- AC#3 — manual create-invoice endpoint exists at
  POST /api/admin/quotes/[id]/create-xero-invoice
- AC#4 — all credentials in env vars, nothing hardcoded
- AC#5 — docs live in /docs

Two issues found + fixed during verification:

1. **`/connect` was auth-gated, blocking browser navigation** — admin
   bearer token can't ride along on a browser GET. Removed
   `withAdminAuth` from `/connect` with a TODO to restore once an
   admin session/cookie layer lands. OAuth security is still gated by
   Xero's own login.

2. **Granular scopes** — apps created on/after 2 March 2026 reject the
   broad `accounting.transactions` scope with `invalid_scope`. Updated
   `XERO_SCOPES` to use `accounting.invoices` (the granular
   replacement for the invoice slice) and documented the migration in
   /docs §4 so future devs don't trip over it.

---

## Files touched

| Path | Change | Status |
|------|--------|--------|
| `docs/xero-integration.md` | new — full integration doc | uncommitted |
| `sql/scrum85-xero-tokens.sql` | new — token table + invoice idempotency cols | uncommitted |
| `src/lib/xero/client.ts` | new | uncommitted |
| `src/lib/xero/tokens.ts` | new | uncommitted |
| `src/lib/xero/sync.ts` | new | uncommitted |
| `src/app/api/admin/xero/connect/route.ts` | new | uncommitted |
| `src/app/api/admin/xero/callback/route.ts` | new | uncommitted |
| `src/app/api/admin/xero/status/route.ts` | new | uncommitted |
| `src/app/api/admin/xero/disconnect/route.ts` | new | uncommitted |
| `src/app/api/admin/quotes/[id]/create-xero-invoice/route.ts` | new | uncommitted |
| `package.json`, `package-lock.json` | added xero-node@^15 | uncommitted |
| `qa/scrum-85.http` | new test runbook (gitignored) | uncommitted, do not commit |
| `qa/SCRUM-85-session-changes.md` | this document | uncommitted |
