import { emailLayout, escapeHtml } from "./layout";
import type { ConsultationBooking } from "../models/consultationBookingModel";

export function adminBookingNotificationEmail(booking: ConsultationBooking): {
  subject: string;
  html: string;
  replyTo: string;
} {
  const body = `
    <p style="margin:0 0 16px;"><strong>New consultation booking</strong></p>

    <h2 style="margin:16px 0 8px; font-size:16px;">Customer</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Name</td><td>${escapeHtml(booking.full_name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Email</td><td><a href="mailto:${escapeHtml(booking.email)}">${escapeHtml(booking.email)}</a></td></tr>
    </table>

    <h2 style="margin:24px 0 8px; font-size:16px;">Requested time</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Date</td><td>${escapeHtml(booking.preferred_date)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Time</td><td>${escapeHtml(booking.preferred_time)}</td></tr>
    </table>

    <h2 style="margin:24px 0 8px; font-size:16px;">Project summary</h2>
    <p style="margin:0; white-space:pre-wrap;">${escapeHtml(booking.project_summary)}</p>

    ${
      booking.referral_source
        ? `<p style="margin:16px 0 0; color:#666; font-size:13px;">Found us via: ${escapeHtml(booking.referral_source)}</p>`
        : ""
    }

    <p style="margin:24px 0 0; font-size:12px; color:#666;">
      Booking ID: ${escapeHtml(booking.id)} &middot; Submitted: ${escapeHtml(booking.created_at)}
    </p>
  `;

  return {
    subject: `New consultation booking from ${booking.full_name}`,
    html: emailLayout({
      preheader: `${booking.full_name} requested ${booking.preferred_date} at ${booking.preferred_time}`,
      bodyHtml: body,
    }),
    replyTo: booking.email,
  };
}
