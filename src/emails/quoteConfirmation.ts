import { emailLayout, escapeHtml } from "./layout";
import type { Quote, SelectedProduct } from "../models/quote.model";

export function quoteConfirmationEmail(quote: Quote): {
  subject: string;
  html: string;
} {
  const productCount = quote.selected_products.length;
  const summedSqm = sumQuantitySqm(quote.selected_products);
  const totalSqm = quote.total_sqm ?? summedSqm;

  const productList = quote.selected_products
    .map(
      (p) =>
        `<li style="padding:4px 0;">${escapeHtml(p.name ?? "Selected product")}${
          typeof p.quantity_sqm === "number"
            ? ` &mdash; ${p.quantity_sqm} sqm`
            : ""
        }</li>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(quote.full_name)},</p>
    <p style="margin:0 0 16px;">Thanks for your quote request. We'll review the details and get back to you shortly.</p>

    <h2 style="margin:24px 0 8px; font-size:16px;">Your request</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Products</td><td>${productCount}</td></tr>
      ${
        totalSqm
          ? `<tr><td style="padding:4px 12px 4px 0; color:#666;">Total area</td><td>${totalSqm} sqm</td></tr>`
          : ""
      }
      ${
        quote.num_properties
          ? `<tr><td style="padding:4px 12px 4px 0; color:#666;">Properties</td><td>${quote.num_properties}</td></tr>`
          : ""
      }
    </table>

    ${
      productCount > 0
        ? `<h2 style="margin:24px 0 8px; font-size:16px;">Selected products</h2>
           <ul style="margin:0; padding-left:20px;">${productList}</ul>`
        : ""
    }

    ${
      quote.customer_notes
        ? `<h2 style="margin:24px 0 8px; font-size:16px;">Your notes</h2>
           <p style="margin:0; white-space:pre-wrap;">${escapeHtml(quote.customer_notes)}</p>`
        : ""
    }

    <p style="margin:24px 0 0;">If anything looks off, just reply to this email.</p>
  `;

  return {
    subject: "We've received your quote request",
    html: emailLayout({
      preheader: `Thanks ${quote.full_name}, we received your quote request.`,
      bodyHtml: body,
    }),
  };
}

function sumQuantitySqm(products: SelectedProduct[]): number {
  return products.reduce(
    (acc, p) => acc + (typeof p.quantity_sqm === "number" ? p.quantity_sqm : 0),
    0
  );
}
