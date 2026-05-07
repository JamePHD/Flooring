import { NextRequest, NextResponse } from "next/server";
import { getXeroClient } from "@/src/lib/xero/client";
import { saveTokens } from "@/src/lib/xero/tokens";

// GET /api/admin/xero/callback
// Step 5 of the OAuth dance. Xero redirects here with ?code=...&state=...
// after the admin authorised. Cannot use withAdminAuth — Xero's
// redirect carries no bearer token. The connect endpoint passed the
// admin's id through `state` so we can attribute the connection.
//
// On success, redirects to /admin (or wherever) with a success flag.
// Frontend can read it from the query string and show a toast.
export async function GET(req: NextRequest) {
  const client = getXeroClient();
  if (!client) {
    return NextResponse.json(
      { error: "Xero not configured" },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) {
    // User denied or Xero returned an error — bounce back to admin UI
    return NextResponse.redirect(
      new URL(`/admin?xero_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  try {
    const tokenSet = await client.apiCallback(req.url);

    if (!tokenSet.access_token || !tokenSet.refresh_token) {
      return NextResponse.json(
        { error: "Xero callback returned no tokens" },
        { status: 502 }
      );
    }

    // Discover the tenant — the org the admin chose during the consent step.
    await client.updateTenants();
    const tenant = client.tenants?.[0];
    if (!tenant) {
      return NextResponse.json(
        { error: "Xero callback returned no tenants" },
        { status: 502 }
      );
    }

    const expiresAt = new Date(
      Date.now() + (tokenSet.expires_in ?? 1800) * 1000
    );

    // The admin id was passed through OAuth `state` by /connect. xero-node
    // doesn't expose state directly — pull it from the URL we received.
    const adminIdFromState = url.searchParams.get("state");

    await saveTokens({
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName ?? null,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      expiresAt,
      scope: tokenSet.scope ?? null,
      connectedBy: adminIdFromState || null,
    });

    return NextResponse.redirect(new URL("/admin?xero=connected", req.url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[xero] callback failed:", msg);
    return NextResponse.redirect(
      new URL(`/admin?xero_error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}
