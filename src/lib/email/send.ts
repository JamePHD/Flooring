import { getEmailClient } from "./client";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
  id?: string;
}

// Never throws. AC#5: email failures must not block API responses.
// Callers should NOT await this in a way that propagates errors —
// fire it after the DB write has succeeded and the caller has decided
// to return success to the client regardless.
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const client = getEmailClient();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not configured — skipping send to ${input.to}`
    );
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const fromEmail = process.env.FROM_EMAIL || "noreply@example.com";

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (error) {
      console.error("[email] send failed:", error);
      return { ok: false, error: error.message || String(error) };
    }
    console.log(`[email] sent → ${input.to} (${input.subject}) id=${data?.id}`);
    return { ok: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] send exception:", msg);
    return { ok: false, error: msg };
  }
}
