import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { getQuoteById } from "@/src/models/quote.model";
import { createInvoiceForQuote } from "@/src/lib/xero/sync";
import { createAdminClient } from "@/src/lib/supabase/admin";

// POST /api/admin/quotes/[id]/create-xero-invoice
// AC#3: the manual "Create Xero Invoice" button target.
//
// Returns:
//   200 — invoice created (or already existed; idempotent)
//   404 — quote not found
//   409 — quote already has xero_invoice_id (refuse to double-bill)
//   412 — Xero not connected; admin needs to /connect first
//   503 — XERO_CLIENT_ID etc. not configured in env
//   502 — Xero API or refresh failure (admin can retry)
export const POST = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, admin, { params }) => {
    const { id } = await params;

    const quote = await getQuoteById(id);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // AC #idempotency: quotes with an existing xero_invoice_id refuse a
    // re-invoice. Documented in /docs/xero-integration.md §7.
    if ((quote as any).xero_invoice_id) {
      return NextResponse.json(
        {
          error: "Quote already has a Xero invoice",
          xero_invoice_id: (quote as any).xero_invoice_id,
          xero_invoice_number: (quote as any).xero_invoice_number ?? null,
        },
        { status: 409 }
      );
    }

    const result = await createInvoiceForQuote(quote);

    if (!result.ok) {
      const statusByReason: Record<typeof result.reason, number> = {
        not_configured: 503,
        not_connected: 412,
        refresh_failed: 412,
        xero_error: 502,
      };
      const messageByReason: Record<typeof result.reason, string> = {
        not_configured:
          "Xero is not configured. Add XERO_CLIENT_ID/SECRET/REDIRECT_URI to .env and restart.",
        not_connected:
          "Xero is not connected. Visit /api/admin/xero/connect to authorise the integration first.",
        refresh_failed:
          "Xero token refresh failed. Reconnect via /api/admin/xero/connect.",
        xero_error: result.error || "Xero rejected the request",
      };
      return NextResponse.json(
        { error: messageByReason[result.reason], details: result.error },
        { status: statusByReason[result.reason] }
      );
    }

    // Persist the invoice id on the quote for idempotency + display.
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("quotes")
      .update({
        xero_invoice_id: result.invoice_id,
        xero_invoice_number: result.invoice_number,
        xero_invoice_created_at: now,
        xero_invoice_created_by: admin.id,
      })
      .eq("id", id);
    if (updErr) {
      // The invoice EXISTS in Xero but we couldn't link it locally.
      // Surface this clearly so the admin can manually paste the id
      // into the DB if they want the link tracked. The 200 reflects
      // that the user-facing action succeeded.
      console.error(
        `[xero] orphan invoice — couldn't link Xero invoice ${result.invoice_id} to quote ${id}:`,
        updErr.message
      );
    }

    return NextResponse.json({
      success: true,
      xero_invoice_id: result.invoice_id,
      xero_invoice_number: result.invoice_number,
      tenant_id: result.tenant_id,
    });
  }
);
