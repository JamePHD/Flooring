// Shared HTML layout for all transactional emails.
// Inline styles only — most email clients strip <style> blocks.
// Plain table-based layout — Outlook desktop in particular hates flexbox/grid.

export interface LayoutInput {
  preheader?: string; // hidden preview text shown in inbox
  bodyHtml: string;
}

const COMPANY_NAME = "Empirical Flooring";
const SUPPORT_EMAIL = process.env.FROM_EMAIL || "noreply@example.com";

export function emailLayout({ preheader, bodyHtml }: LayoutInput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${COMPANY_NAME}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#222;">
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; max-width:600px;">
          <tr>
            <td style="padding:24px 32px; background-color:#1f2937; color:#ffffff;">
              <h1 style="margin:0; font-size:20px; font-weight:600;">${COMPANY_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; background-color:#f4f4f4; color:#666; font-size:12px; line-height:18px;">
              ${COMPANY_NAME} &middot; <a href="mailto:${SUPPORT_EMAIL}" style="color:#666; text-decoration:underline;">${SUPPORT_EMAIL}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
