import { render } from "@react-email/render";
import { ReactElement } from "react";
import { resend, EMAIL_FROM } from "./client";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  replyTo?: string;
}

/**
 * Send an email via Resend.
 *
 * IMPORTANT: This function NEVER throws. Email failure must not block
 * submission flows (AC#7 of SCRUM-80). Errors are logged for debugging.
 *
 * Returns true if the email was sent successfully, false otherwise.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, template, replyTo } = options;

  try {
    const html = await render(template);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error("[email] Failed to send:", { subject, to, error });
      return false;
    }

    console.log("[email] Sent:", { id: data?.id, subject, to });
    return true;
  } catch (err) {
    console.error("[email] Unexpected error:", { subject, to, err });
    return false;
  }
}