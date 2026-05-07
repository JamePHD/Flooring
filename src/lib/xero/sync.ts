import { Contact, Invoice, LineItem, Phone } from "xero-node";
import type { Quote } from "../../models/quote.model";
import { getActiveXeroClient } from "./tokens";

// ─── Result shapes ───────────────────────────────────────────

export type CreateInvoiceResult =
  | {
      ok: true;
      invoice_id: string;
      invoice_number: string | undefined;
      tenant_id: string;
    }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "not_connected"
        | "refresh_failed"
        | "xero_error";
      error?: string;
      status?: number;
    };

// ─── Quote → Xero Invoice mapping ────────────────────────────
// See /docs/xero-integration.md §6 for the full mapping rationale.

export async function createInvoiceForQuote(
  quote: Quote
): Promise<CreateInvoiceResult> {
  const session = await getActiveXeroClient();
  if (!session.ok) {
    return {
      ok: false,
      reason: session.reason,
      error: "error" in session ? session.error : undefined,
    };
  }

  const { client, tenantId } = session;

  try {
    // 1. Create a Contact for the customer.
    // (No deduplication for MVP — see /docs/xero-integration.md "What's NOT implemented".)
    const contactBody: Contact = {
      name: quote.full_name,
      emailAddress: quote.email,
      phones: quote.phone
        ? [
            {
              phoneType: Phone.PhoneTypeEnum.DEFAULT,
              phoneNumber: quote.phone,
            },
          ]
        : undefined,
    };

    const contactsRes = await client.accountingApi.createContacts(tenantId, {
      contacts: [contactBody],
    });
    const contact = contactsRes.body.contacts?.[0];
    if (!contact?.contactID) {
      return {
        ok: false,
        reason: "xero_error",
        error: "Xero did not return a Contact ID",
      };
    }

    // 2. Build line items from selected_products.
    const lineItems: LineItem[] = quote.selected_products.map((p) => ({
      description: `${p.name ?? "Product"} (${p.id})`,
      quantity: typeof p.quantity_sqm === "number" ? p.quantity_sqm : 1,
      unitAmount: 0, // Placeholder — admin sets real prices in Xero
      accountCode: "200", // Xero default Sales account
    }));

    // 3. Append customer notes as a zero-value note line if present.
    if (quote.customer_notes && quote.customer_notes.trim()) {
      lineItems.push({
        description: `Customer notes: ${quote.customer_notes.trim()}`,
        quantity: 0,
        unitAmount: 0,
      });
    }

    // 4. Create the invoice as DRAFT (admin reviews + sends from Xero UI).
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14);

    const invoiceBody: Invoice = {
      type: Invoice.TypeEnum.ACCREC,
      contact: { contactID: contact.contactID },
      lineItems,
      date: today.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      reference: `EFW-Q-${quote.id.slice(0, 8)}`,
      status: Invoice.StatusEnum.DRAFT,
    };

    const invoicesRes = await client.accountingApi.createInvoices(tenantId, {
      invoices: [invoiceBody],
    });
    const invoice = invoicesRes.body.invoices?.[0];
    if (!invoice?.invoiceID) {
      return {
        ok: false,
        reason: "xero_error",
        error: "Xero did not return an Invoice ID",
      };
    }

    return {
      ok: true,
      invoice_id: invoice.invoiceID,
      invoice_number: invoice.invoiceNumber,
      tenant_id: tenantId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[xero] create invoice for quote ${quote.id} failed:`, msg);
    return { ok: false, reason: "xero_error", error: msg };
  }
}
