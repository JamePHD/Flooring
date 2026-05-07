import { getHubspotClient } from "./client";
import type { Quote } from "../../models/quote.model";
import type { ConsultationBooking } from "../../models/consultationBookingModel";

const SOURCE_LABEL = "Empirical Flooring Website";
const DEFAULT_DEAL_STAGE =
  process.env.HUBSPOT_DEAL_STAGE_ID || "appointmentscheduled";
const DEFAULT_PIPELINE = process.env.HUBSPOT_PIPELINE_ID || "default";

// ─── Result shapes ───────────────────────────────────────────

export interface SyncSuccess {
  ok: true;
  contactId: string;
  dealId?: string;
}

export interface SyncFailure {
  ok: false;
  error: string;
}

export type SyncResult = SyncSuccess | SyncFailure;

// ─── Helpers ─────────────────────────────────────────────────

function splitName(full: string): { firstname: string; lastname: string } {
  const trimmed = full.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstname: trimmed, lastname: "" };
  return {
    firstname: parts[0],
    lastname: parts.slice(1).join(" "),
  };
}

function formatProductInterest(quote: Quote): string {
  if (!quote.selected_products || quote.selected_products.length === 0) {
    return "—";
  }
  return quote.selected_products
    .map((p) => {
      const name = p.name ?? `Product ${p.id}`;
      const sqm = typeof p.quantity_sqm === "number" ? ` (${p.quantity_sqm} sqm)` : "";
      return `${name}${sqm}`;
    })
    .join(", ");
}

function errToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const anyErr = err as any;
    return anyErr.message || JSON.stringify(anyErr).slice(0, 500);
  }
  return String(err);
}

// ─── Quote → HubSpot (contact + deal, AC#1) ──────────────────

export async function syncQuoteToHubspot(quote: Quote): Promise<SyncResult> {
  const client = getHubspotClient();
  if (!client) {
    console.warn(
      `[hubspot] HUBSPOT_ACCESS_TOKEN not set — skipping quote ${quote.id} sync`
    );
    return { ok: false, error: "HUBSPOT_ACCESS_TOKEN not configured" };
  }

  const { firstname, lastname } = splitName(quote.full_name);
  const productInterest = formatProductInterest(quote);

  try {
    // 1. Create contact (AC#3). Only standard contact properties — `description`
    // is NOT a default contact property in HubSpot (it IS on deals, where it's
    // used below). Skip empty phone.
    const contactProps: Record<string, string> = {
      email: quote.email,
      firstname,
      lastname,
      lifecyclestage: "lead",
      hs_lead_status: "NEW",
    };
    if (quote.phone && quote.phone.trim()) {
      contactProps.phone = quote.phone.trim();
    }

    const contact = await client.crm.contacts.basicApi.create({
      properties: contactProps,
      associations: [],
    });

    // 2. Create deal associated with the contact (AC#4)
    // `description` IS a standard property on deals, so we put project context here.
    const deal = await client.crm.deals.basicApi.create({
      properties: {
        dealname: `${SOURCE_LABEL} — Quote: ${quote.full_name}`,
        pipeline: DEFAULT_PIPELINE,
        dealstage: DEFAULT_DEAL_STAGE,
        description: [
          `Source: ${SOURCE_LABEL}`,
          `User path: ${quote.user_path}`,
          `Product interest: ${productInterest}`,
          quote.total_sqm ? `Square meterage: ${quote.total_sqm} sqm` : null,
          quote.num_properties ? `Properties: ${quote.num_properties}` : null,
          quote.customer_notes ? `Customer notes: ${quote.customer_notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      associations: [
        {
          to: { id: contact.id },
          // 3 = Deal-to-Contact "primary" association type id (HubSpot default).
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 3,
            },
          ],
        },
      ],
    });

    return { ok: true, contactId: contact.id, dealId: deal.id };
  } catch (err) {
    const error = errToString(err);
    console.error(`[hubspot] quote ${quote.id} sync failed:`, error);
    return { ok: false, error };
  }
}

// ─── Booking → HubSpot (contact only, AC#2) ──────────────────

export async function syncBookingToHubspot(
  booking: ConsultationBooking
): Promise<SyncResult> {
  const client = getHubspotClient();
  if (!client) {
    console.warn(
      `[hubspot] HUBSPOT_ACCESS_TOKEN not set — skipping booking ${booking.id} sync`
    );
    return { ok: false, error: "HUBSPOT_ACCESS_TOKEN not configured" };
  }

  const { firstname, lastname } = splitName(booking.full_name);

  try {
    // Only standard contact properties — `description` doesn't exist on
    // contacts in HubSpot. Booking project context (preferred date/time,
    // summary, referral) lives in the SCRUM-107 admin notification email
    // instead. Admin can also add a Note engagement to the contact in
    // HubSpot UI if they want it visible there.
    const contact = await client.crm.contacts.basicApi.create({
      properties: {
        email: booking.email,
        firstname,
        lastname,
        lifecyclestage: "lead",
        hs_lead_status: "NEW",
      },
      associations: [],
    });

    return { ok: true, contactId: contact.id };
  } catch (err) {
    const error = errToString(err);
    console.error(`[hubspot] booking ${booking.id} sync failed:`, error);
    return { ok: false, error };
  }
}

// ─── SCRUM-83: status updates pushed to HubSpot (AC#5) ───────

// Map our SCRUM-83 lifecycle to HubSpot's standard hs_lead_status enum.
// "where possible" per AC#5 — values without a clean match get mapped
// to the nearest sensible HubSpot value.
const STATUS_TO_HS_LEAD_STATUS: Record<string, string> = {
  new: "NEW",
  contacted: "ATTEMPTED_TO_CONTACT",
  in_progress: "IN_PROGRESS",
  quote_sent: "OPEN_DEAL",
  closed_won: "CONNECTED",
  closed_lost: "UNQUALIFIED",
  // legacy fallbacks
  pending: "NEW",
  confirmed: "CONNECTED",
  completed: "CONNECTED",
  cancelled: "UNQUALIFIED",
  closed: "CONNECTED",
};

// For deals: SCRUM-83 statuses that should flip the deal stage.
// Using HubSpot's standard internal stage names from the default pipeline.
const STATUS_TO_DEAL_STAGE: Record<string, string | undefined> = {
  closed_won: "closedwon",
  closed_lost: "closedlost",
  // Other statuses don't auto-advance the deal stage.
};

// For contacts: terminal statuses flip lifecyclestage past "lead".
const STATUS_TO_LIFECYCLESTAGE: Record<string, string | undefined> = {
  closed_won: "customer",
};

export interface StatusSyncInput {
  hubspotContactId: string | null;
  hubspotDealId?: string | null;
  newStatus: string;
}

export async function syncStatusToHubspot(
  input: StatusSyncInput
): Promise<SyncResult> {
  const client = getHubspotClient();
  if (!client) {
    return { ok: false, error: "HUBSPOT_ACCESS_TOKEN not configured" };
  }
  if (!input.hubspotContactId) {
    return {
      ok: false,
      error: "Lead has no hubspot_contact_id — sync was never run for this lead",
    };
  }

  try {
    // Update the contact (always)
    const contactProps: Record<string, string> = {
      hs_lead_status: STATUS_TO_HS_LEAD_STATUS[input.newStatus] || "OPEN",
    };
    const newLifecycle = STATUS_TO_LIFECYCLESTAGE[input.newStatus];
    if (newLifecycle) contactProps.lifecyclestage = newLifecycle;

    await client.crm.contacts.basicApi.update(input.hubspotContactId, {
      properties: contactProps,
    });

    // Update the deal too if there is one and the status maps to a stage
    if (input.hubspotDealId) {
      const newStage = STATUS_TO_DEAL_STAGE[input.newStatus];
      if (newStage) {
        await client.crm.deals.basicApi.update(input.hubspotDealId, {
          properties: { dealstage: newStage },
        });
      }
    }

    return { ok: true, contactId: input.hubspotContactId, dealId: input.hubspotDealId ?? undefined };
  } catch (err) {
    const error = errToString(err);
    console.error(
      `[hubspot] status sync failed for contact ${input.hubspotContactId}:`,
      error
    );
    return { ok: false, error };
  }
}
