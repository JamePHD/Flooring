import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { isXeroConfigured } from "@/src/lib/xero/client";
import { loadStoredTokens } from "@/src/lib/xero/tokens";

// GET /api/admin/xero/status
// Lets the admin UI show "Connected to <org>" or a Connect button.
export const GET = withAdminAuth(async (_req: NextRequest, _admin) => {
  if (!isXeroConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
    });
  }
  const tokens = await loadStoredTokens();
  if (!tokens) {
    return NextResponse.json({ configured: true, connected: false });
  }
  return NextResponse.json({
    configured: true,
    connected: true,
    tenant_name: tokens.tenant_name,
    connected_at: tokens.connected_at,
  });
});
