# Xero Integration

**Status:** Partially implemented (SCRUM-85). OAuth + manual invoice
creation done; full automation (auto-create on quote acceptance,
payment reconciliation, status webhooks) deferred to a future sprint.

This document covers everything a future developer needs to extend the
integration without re-reverse-engineering it.

---

## 1. What's implemented today

- OAuth 2.0 connect / disconnect flow with token persistence in Supabase
- Automatic access-token refresh (refresh tokens last 60 days)
- Manual `POST /api/admin/leads/quote/[id]/create-xero-invoice`
  endpoint that builds an invoice from quote data and pushes to Xero

## 2. What's NOT implemented (intentionally deferred)

- Auto-create invoice on quote status change to `closed_won`
- Payment status webhook back from Xero
- Multi-tenant support (the `xero_tokens` table holds one connection)
- Invoice line-item mapping for products with variants/SKUs (current
  mapping uses product name + customer notes as a single description)
- Customer (Contact) deduplication by email — currently creates a new
  Contact for every invoice; collapse later via Xero's contact search

## 3. Architecture

```
Customer submits quote → DB row in `quotes` table
                                 │
                                 │ (admin reviews in dashboard)
                                 ▼
              Admin clicks "Create Xero Invoice" button
                                 │
                                 ▼
       POST /api/admin/leads/quote/[id]/create-xero-invoice
                                 │
                                 ▼
                   src/lib/xero/sync.ts
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
   Get tokens from xero_tokens     Refresh if access_token expired
              │                                     │
              └──────────────┬──────────────────────┘
                             ▼
                Build Invoice payload from Quote
                             │
                             ▼
           xero-node SDK → Xero Accounting API
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       Success: store invoice_id        Failure: log + return 502
       on quotes.xero_invoice_id        admin sees error in UI
```

## 4. Authentication flow (OAuth 2.0)

### Setup (one-time, per environment)

1. Create a Xero developer account: https://developer.xero.com/
2. **My Apps → New app** → web app, set the redirect URI to
   `<your-site-url>/api/admin/xero/callback` (e.g. `http://localhost:3000/api/admin/xero/callback` for dev)
3. Copy the **Client id** and generate a **Client secret**
4. Add to `.env.local`:
   ```
   XERO_CLIENT_ID=<from My Apps>
   XERO_CLIENT_SECRET=<from My Apps>
   XERO_REDIRECT_URI=http://localhost:3000/api/admin/xero/callback
   ```
5. (Optional) Create a [Demo Company](https://developer.xero.com/documentation/getting-started-guide/#test-with-the-demo-company)
   in your Xero org — gives you a sandbox tenant with sample data

### Runtime flow (3-legged OAuth)

```
1. Admin clicks "Connect to Xero" in admin UI
       │
       ▼
2. GET /api/admin/xero/connect
       → Redirects browser to https://login.xero.com/identity/connect/authorize?...
       │   (with client_id, redirect_uri, scope, state)
       ▼
3. Admin logs into Xero, picks an org, clicks Allow
       │
       ▼
4. Xero redirects to <redirect_uri>?code=<auth_code>&state=<state>
       │
       ▼
5. GET /api/admin/xero/callback
       → Exchanges code for { access_token, refresh_token, id_token }
       → Calls Xero Connections API to discover tenant_id + tenant_name
       → Upserts the row in `xero_tokens` (single-row table, see schema)
       │
       ▼
6. Browser redirected back to /admin (or wherever)
```

### Scopes

The `connect` endpoint requests:
- `openid profile email` — required for OAuth identity
- `offline_access` — required to receive a refresh_token
- `accounting.contacts` — to create a Contact for the customer
- `accounting.invoices` — to create the Invoice (granular scope)

**Granular scopes (Xero rolled this out March 2026):** Apps created
on or after 2 March 2026 **cannot use the old broad scopes** like
`accounting.transactions` or `accounting.reports.read`. Requesting
them returns `Error: invalid_scope` from Xero's authorise screen.

The mapping that affects us:
- `accounting.transactions` → split into 5 granular scopes; we use
  `accounting.invoices` (covers Invoices, Credit Notes, Quotes,
  Purchase Orders, Repeating Invoices, Items). The other 4
  (`accounting.payments`, `accounting.banktransactions`,
  `accounting.manualjournals`, `accounting.classicexpenses`) aren't
  needed today.
- `accounting.contacts` — **unchanged**, still valid.
- `accounting.settings`, `accounting.attachments`, `accounting.budgets`
  — also unchanged.

If you add functionality (e.g. process payments), pick the relevant
granular scope from the [Xero scopes reference](https://developer.xero.com/documentation/guides/oauth2/scopes/),
add it to `XERO_SCOPES` in `src/lib/xero/client.ts`, AND re-run the
connect flow — Xero won't extend an existing token's scope on refresh.

### Token refresh

- Access tokens: **30 minutes** lifetime
- Refresh tokens: **60 days** lifetime, **rotate on each use**
  (the new refresh_token must be saved over the old one)
- `getActiveXeroClient()` in `src/lib/xero/client.ts` checks
  `expires_at` on every call and refreshes if within a 60-second buffer
- If 60 days pass with no use, the refresh token expires and admin
  must reconnect via `/api/admin/xero/connect`. There's no recovery
  short of re-authorising — Xero's design.

---

## 5. API endpoints required for invoice creation

### Xero Accounting API endpoints used

| Endpoint | Purpose | Triggered by |
|----------|---------|--------------|
| `POST /api.xro/2.0/Contacts` | Create or get the Customer record | Each manual invoice creation (via SDK `createContacts`) |
| `POST /api.xro/2.0/Invoices` | Create the Invoice itself | Each manual invoice creation (via SDK `createInvoices`) |
| `GET /connections` (Identity API) | Discover tenant_id after OAuth callback | Once, during `/api/admin/xero/callback` |

The `xero-node` SDK wraps these — see
`src/lib/xero/sync.ts::createInvoiceForQuote` for the actual calls.

### Future endpoints (when extending)

| Endpoint | Purpose |
|----------|---------|
| `GET /api.xro/2.0/Invoices/{id}` | Poll an invoice's status (sent/paid/voided) |
| `POST /api.xro/2.0/Invoices/{id}/Email` | Email an invoice from Xero (vs. Resend) |
| `GET /api.xro/2.0/Payments` | Reconcile payments back to quotes |
| Webhooks: `INVOICE` events | Real-time payment status without polling |

---

## 6. Data mapping: Quote → Xero Invoice

### Customer (Contact)

| Xero field | Source |
|------------|--------|
| `Name` | `quote.full_name` |
| `EmailAddress` | `quote.email` |
| `Phones[0].PhoneNumber` (DEFAULT) | `quote.phone` (if set) |

A new Contact is created for each invoice today. Future improvement:
look up by email first via `GET /Contacts?where=EmailAddress=...`.

### Invoice

| Xero field | Source / value |
|------------|----------------|
| `Type` | `"ACCREC"` (sales invoice) |
| `Contact.ContactID` | The Contact created above |
| `Date` | Today |
| `DueDate` | Today + 14 days |
| `Status` | `"DRAFT"` (admin reviews + sends from Xero UI) |
| `Reference` | `EFW-Q-${quote.id.slice(0, 8)}` (Empirical Flooring Website Quote, short id) |
| `LineItems` | One line per `quote.selected_products[]` entry |

### Line items

Each `selected_products[]` becomes one line item:

| Xero LineItem field | Source |
|---------------------|--------|
| `Description` | `${product.name} (${product.id})` — id appended for traceability |
| `Quantity` | `product.quantity_sqm` if set, else `1` |
| `UnitAmount` | `0.00` — **placeholder** (price discovery not implemented; admin sets in Xero) |
| `AccountCode` | `"200"` — Xero's default Sales account in most charts |

**Pricing limitation:** The current `quotes` table doesn't capture
per-product unit prices. The invoice goes out as a `DRAFT` with
zero-value line items so the admin sets prices in Xero before sending.
Future improvement: capture `unit_price_per_sqm` on the quote at
submission time, possibly from a `product_variants` price lookup.

### Where customer notes go

If `quote.customer_notes` is set, it's appended as an extra line item
with `Description: "Customer notes: ${notes}"`, `Quantity: 0`,
`UnitAmount: 0`. Keeps the context visible without affecting the total.

---

## 7. Error handling approach

### Layer-by-layer strategy

| Failure | Handler | Behaviour |
|---------|---------|-----------|
| `XERO_CLIENT_ID` not set | `getXeroClient()` returns `null` | Endpoint returns 503 with "Xero not configured" |
| No `xero_tokens` row | `loadStoredTokens()` returns `null` | Endpoint returns 412 "Connect Xero in admin first" with a link to `/api/admin/xero/connect` |
| Refresh token expired (>60 days) | Refresh call returns 400/401 | Wipe `xero_tokens` row, return 412 prompting reconnection |
| Quote not found / wrong owner | `getQuoteById` returns null | 404 |
| Xero API 4xx | xero-node throws | Return 502 with Xero's error message; do NOT mark quote as invoiced |
| Xero API 5xx / network | xero-node throws or timeout | Return 502; admin retries |
| DB write fails AFTER Xero success | Logged + audit-trail the orphan invoice id | Return 200 — the invoice exists in Xero; admin manually links |

### Idempotency

The `quotes.xero_invoice_id` column tracks whether a quote has already
been invoiced. The endpoint returns 409 if `xero_invoice_id` is set
to prevent accidental double-billing. To re-invoice (after voiding in
Xero), admin clears the column manually via SQL — no UI affordance
yet by design.

---

## 8. Where the code lives

| Path | What |
|------|------|
| `src/lib/xero/client.ts` | Lazy `XeroClient` init, scope list |
| `src/lib/xero/tokens.ts` | DB read/write for `xero_tokens`, `getActiveXeroClient()` (handles refresh) |
| `src/lib/xero/sync.ts` | `createInvoiceForQuote(quote)` — the actual mapping |
| `src/app/api/admin/xero/connect/route.ts` | Step 1 of OAuth |
| `src/app/api/admin/xero/callback/route.ts` | Step 5 of OAuth |
| `src/app/api/admin/xero/status/route.ts` | "Are we connected?" check for the admin UI |
| `src/app/api/admin/xero/disconnect/route.ts` | Wipes the token row |
| `src/app/api/admin/leads/quote/[id]/create-xero-invoice/route.ts` | The "Create Invoice" button target |
| `sql/scrum85-xero-tokens.sql` | Migration |

---

## 9. Frontend tasks (not in this sprint)

- "Connect to Xero" button on the admin dashboard. Click → redirects
  to `/api/admin/xero/connect`. Show connection status from
  `/api/admin/xero/status`.
- "Create Xero Invoice" button on each quote in the leads detail view.
  Click → POSTs to the per-quote endpoint, shows the returned invoice
  link to the admin.
- Disable the button if the quote already has `xero_invoice_id` set,
  show a "View in Xero" link instead.

---

## 10. Going to production

Before flipping to a production Xero org:

1. Create a separate Xero app in the developer portal for prod (don't
   share dev credentials).
2. Add the prod redirect URI to that app
   (`https://www.empiricalflooring.com.au/api/admin/xero/callback`).
3. Set production `.env`:
   ```
   XERO_CLIENT_ID=<prod-app-client-id>
   XERO_CLIENT_SECRET=<prod-app-client-secret>
   XERO_REDIRECT_URI=https://www.empiricalflooring.com.au/api/admin/xero/callback
   ```
4. Run the OAuth flow once with the production admin user against the
   real org.
5. Verify a test invoice appears in the org's Drafts.
6. (Optional) configure webhooks in the Xero app for real-time status —
   future work.

---

## 11. Useful references

- Xero developer docs: https://developer.xero.com/documentation/
- OAuth 2.0 flow: https://developer.xero.com/documentation/guides/oauth2/auth-flow/
- Accounting API — Invoices: https://developer.xero.com/documentation/api/accounting/invoices
- xero-node SDK: https://github.com/XeroAPI/xero-node
