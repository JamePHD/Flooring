import { emailLayout, escapeHtml } from "./layout";

export interface HubspotFailureInput {
  leadType: "quote" | "consultation";
  leadId: string;
  customerName: string;
  customerEmail: string;
  errorMessage: string;
}

// AC#5: admin notified when HubSpot sync fails. Reuses the SCRUM-107
// transactional email plumbing — sent to SALES_REP_EMAIL by the caller.
export function hubspotSyncFailureEmail(input: HubspotFailureInput): {
  subject: string;
  html: string;
} {
  const body = `
    <p style="margin:0 0 16px;"><strong>Heads up — a HubSpot sync just failed.</strong></p>
    <p style="margin:0 0 16px;">The ${input.leadType} submission landed in the database
    successfully, but the corresponding HubSpot ${input.leadType === "quote" ? "contact + deal" : "contact"}
    was NOT created. You'll need to add the lead manually, or fix the underlying
    issue and re-run the sync.</p>

    <h2 style="margin:24px 0 8px; font-size:16px;">Lead details</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Type</td><td>${escapeHtml(input.leadType)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">DB ID</td><td><code>${escapeHtml(input.leadId)}</code></td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Name</td><td>${escapeHtml(input.customerName)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Email</td><td><a href="mailto:${escapeHtml(input.customerEmail)}">${escapeHtml(input.customerEmail)}</a></td></tr>
    </table>

    <h2 style="margin:24px 0 8px; font-size:16px;">HubSpot error</h2>
    <pre style="margin:0; padding:12px; background:#f4f4f4; border-radius:4px; font-size:13px; white-space:pre-wrap; word-break:break-word;">${escapeHtml(input.errorMessage)}</pre>

    <p style="margin:24px 0 0; color:#666; font-size:13px;">
      Common causes: invalid HUBSPOT_ACCESS_TOKEN, deleted contact properties,
      misconfigured pipeline/dealstage IDs, or HubSpot API rate limit.
    </p>
  `;

  return {
    subject: `[Action needed] HubSpot sync failed for ${input.leadType} ${input.leadId}`,
    html: emailLayout({
      preheader: `HubSpot sync failed for ${input.customerName} — manual follow-up needed`,
      bodyHtml: body,
    }),
  };
}
