import { NextRequest, NextResponse } from "next/server";
import { getXeroClient } from "@/src/lib/xero/client";

// GET /api/admin/xero/connect
// Step 1 of the OAuth dance — redirects the admin's browser to Xero's
// authorise screen. After they pick an org and click Allow, Xero
// redirects back to /api/admin/xero/callback with ?code=...&state=...
//
// **Auth note (TODO restore once admin session/cookie auth exists):**
// This endpoint is intentionally NOT wrapped in `withAdminAuth` because
// browser navigation can't carry the bearer token — there's no admin
// UI session/cookie layer yet. The OAuth flow itself is gated by Xero
// (the user must log into Xero with credentials that have access to
// the org's books), and the /callback handler is the only place that
// actually mutates state. Once an admin login UI with cookie-backed
// sessions lands, re-wrap this in `withAdminAuth` (or its
// session-aware equivalent) so the connect link can only be initiated
// by a logged-in admin. Without an authenticated admin context, the
// callback stores `connected_by` as null in this dev mode.
export async function GET(_req: NextRequest) {
  const client = getXeroClient();
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Xero not configured. Add XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI to .env.local.",
      },
      { status: 503 }
    );
  }

  const consentUrl = await client.buildConsentUrl();
  return NextResponse.redirect(consentUrl);
}
