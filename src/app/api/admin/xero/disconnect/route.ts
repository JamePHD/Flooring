import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { clearTokens } from "@/src/lib/xero/tokens";

// POST /api/admin/xero/disconnect
// Wipes the stored tokens. Doesn't revoke them on Xero's side — admin
// can do that manually in the Xero connected-apps UI if needed.
export const POST = withAdminAuth(async (_req: NextRequest, _admin) => {
  await clearTokens();
  return NextResponse.json({ success: true });
});
