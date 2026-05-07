import { XeroClient } from "xero-node";

// Scopes requested during OAuth. Add new scopes here when extending
// (e.g. "accounting.reports.aged.read" for reporting). Admin must
// re-run the connect flow after a scope change — Xero won't extend an
// existing token's scope on refresh.
//
// Granular scopes note (see /docs/xero-integration.md §4):
// Apps created on/after 2 March 2026 cannot use the broad
// `accounting.transactions` scope — Xero returns `invalid_scope`. We
// use the granular `accounting.invoices` instead, which is the
// invoice-creation slice we actually need. `accounting.contacts` was
// unchanged in the granular split and remains valid for both old and
// new apps.
export const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.contacts",
  "accounting.invoices",
];

// Lazy: returns null if env vars are missing so module load doesn't
// crash. Endpoint handlers translate null → 503 "Xero not configured".
export function getXeroClient(): XeroClient | null {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;

  return new XeroClient({
    clientId,
    clientSecret,
    redirectUris: [redirectUri],
    scopes: XERO_SCOPES,
  });
}

export function isXeroConfigured(): boolean {
  return Boolean(
    process.env.XERO_CLIENT_ID &&
      process.env.XERO_CLIENT_SECRET &&
      process.env.XERO_REDIRECT_URI
  );
}
