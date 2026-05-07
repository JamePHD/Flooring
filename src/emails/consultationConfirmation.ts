import { emailLayout, escapeHtml } from "./layout";
import type { ConsultationBooking } from "../models/consultationBookingModel";

export function consultationConfirmationEmail(booking: ConsultationBooking): {
  subject: string;
  html: string;
} {
  const formatted = formatDateTime(booking.preferred_date, booking.preferred_time);

  const body = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(booking.full_name)},</p>
    <p style="margin:0 0 16px;">Your free 15-minute consultation has been requested for:</p>

    <p style="margin:0 0 16px; font-size:18px; font-weight:600;">${escapeHtml(formatted)}</p>

    <p style="margin:0 0 16px;">A member of our team will confirm the time with you shortly. If you need to reschedule, just reply to this email.</p>

    ${
      booking.project_summary
        ? `<h2 style="margin:24px 0 8px; font-size:16px;">Your project summary</h2>
           <p style="margin:0; white-space:pre-wrap;">${escapeHtml(booking.project_summary)}</p>`
        : ""
    }
  `;

  return {
    subject: "Your consultation request has been received",
    html: emailLayout({
      preheader: `Consultation requested for ${formatted}`,
      bodyHtml: body,
    }),
  };
}

// AC#3: confirmation email has formatted date/time
function formatDateTime(dateIso: string, timeStr: string): string {
  // dateIso is yyyy-mm-dd (DATE column); timeStr is HH:MM or HH:MM:SS
  try {
    const [y, m, d] = dateIso.split("-").map(Number);
    if (!y || !m || !d) return `${dateIso} at ${timeStr}`;
    const date = new Date(Date.UTC(y, m - 1, d));
    const dayName = date.toLocaleDateString("en-AU", {
      weekday: "long",
      timeZone: "UTC",
    });
    const monthName = date.toLocaleDateString("en-AU", {
      month: "long",
      timeZone: "UTC",
    });
    const time = formatTime(timeStr);
    return `${dayName}, ${d} ${monthName} ${y} at ${time}`;
  } catch {
    return `${dateIso} at ${timeStr}`;
  }
}

function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, "0")}${period}`;
}
