import { emailLayout, escapeHtml } from "./layout";
import type { Quote } from "../models/quote.model";

export function adminQuoteNotificationEmail(quote: Quote): {
  subject: string;
  html: string;
  replyTo: string;
} {
  const productList = quote.selected_products
    .map(
      (p) =>
        `<li style="padding:4px 0;">${escapeHtml(p.name ?? "(unnamed)")} &mdash; id: <code style="background:#f4f4f4; padding:2px 4px; border-radius:3px;">${escapeHtml(p.id)}</code>${
          typeof p.quantity_sqm === "number"
            ? ` &mdash; ${p.quantity_sqm} sqm`
            : ""
        }</li>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 16px;"><strong>New quote request</strong> &mdash; user path: <code>${escapeHtml(quote.user_path)}</code></p>

    <h2 style="margin:16px 0 8px; font-size:16px;">Customer</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Name</td><td>${escapeHtml(quote.full_name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Email</td><td><a href="mailto:${escapeHtml(quote.email)}">${escapeHtml(quote.email)}</a></td></tr>
      ${quote.phone ? `<tr><td style="padding:4px 12px 4px 0; color:#666;">Phone</td><td><a href="tel:${escapeHtml(quote.phone)}">${escapeHtml(quote.phone)}</a></td></tr>` : ""}
    </table>

    <h2 style="margin:24px 0 8px; font-size:16px;">Project</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      ${
        quote.num_properties
          ? `<tr><td style="padding:4px 12px 4px 0; color:#666;">Properties</td><td>${quote.num_properties}</td></tr>`
          : ""
      }
      ${
        quote.total_sqm
          ? `<tr><td style="padding:4px 12px 4px 0; color:#666;">Total sqm</td><td>${quote.total_sqm}</td></tr>`
          : ""
      }
      ${
        quote.session_token
          ? `<tr><td style="padding:4px 12px 4px 0; color:#666;">Qualifying session</td><td><code>${escapeHtml(quote.session_token)}</code></td></tr>`
          : ""
      }
    </table>

    <h2 style="margin:24px 0 8px; font-size:16px;">Selected products (${quote.selected_products.length})</h2>
    <ul style="margin:0; padding-left:20px;">${productList}</ul>

    ${
      quote.customer_notes
        ? `<h2 style="margin:24px 0 8px; font-size:16px;">Customer notes</h2>
           <p style="margin:0; white-space:pre-wrap;">${escapeHtml(quote.customer_notes)}</p>`
        : ""
    }

    <p style="margin:24px 0 0; font-size:12px; color:#666;">
      Quote ID: ${escapeHtml(quote.id)} &middot; Submitted: ${escapeHtml(quote.created_at)}
    </p>
  `;

  return {
    subject: `New quote request from ${quote.full_name}`,
    html: emailLayout({
      preheader: `${quote.user_path} request from ${quote.full_name}`,
      bodyHtml: body,
    }),
    // AC#2: replyTo set to the customer's email so admin can reply directly
    replyTo: quote.email,
  };
}
