import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createBooking,
  getBookingById,
  listBookings,
  recordBookingHubspotSync,
  updateBooking,
  deleteBooking,
} from "../models/consultationBookingModel";
import { detectAndFlagDuplicate, recordStatusChange } from "../models/lead.model";
import { sendEmail } from "../lib/email/send";
import { consultationConfirmationEmail } from "../emails/consultationConfirmation";
import { adminBookingNotificationEmail } from "../emails/adminBookingNotification";
import { hubspotSyncFailureEmail } from "../emails/hubspotSyncFailure";
import { syncBookingToHubspot, syncStatusToHubspot } from "../lib/hubspot/sync";

// ─── Validation Schemas ──────────────────────────────────────

// SCRUM-83 canonical lifecycle + legacy values for back-compat.
const bookingStatusSchema = z.enum([
  "new",
  "contacted",
  "in_progress",
  "quote_sent",
  "closed_won",
  "closed_lost",
  // legacy
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "closed",
]);

const createBookingSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  preferred_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date >= new Date(new Date().toDateString());
    }, "Date must be today or in the future"),
  preferred_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM or HH:MM:SS format"),
  project_summary: z.string().trim().min(10, "Please provide a brief project summary").max(2000),
  referral_source: z.string().trim().max(200).optional(),
});

const updateBookingSchema = z.object({
  status: bookingStatusSchema.optional(),
  admin_notes: z.string().max(5000).optional(),
}).refine(
  (data) => data.status !== undefined || data.admin_notes !== undefined,
  { message: "At least one field (status or admin_notes) must be provided" }
);

const listBookingsQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

// ─── Public Handlers ─────────────────────────────────────────

export async function createBookingHandler(req: Request) {
  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const booking = await createBooking(parsed.data);

    // AC#5: emails are best-effort. sendEmail never throws — failures are
    // logged but do not block the 201 response or affect the DB write.
    const adminTo =
      process.env.SALES_REP_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;

    const customerEmail = consultationConfirmationEmail(booking);
    await sendEmail({
      to: booking.email,
      subject: customerEmail.subject,
      html: customerEmail.html,
    });

    if (adminTo) {
      const adminEmail = adminBookingNotificationEmail(booking);
      await sendEmail({
        to: adminTo,
        subject: adminEmail.subject,
        html: adminEmail.html,
        replyTo: adminEmail.replyTo,
      });
    }

    // SCRUM-82: HubSpot sync. Best-effort, never throws. Records outcome
    // on the booking row; on failure also pings the admin via email.
    const hubspotResult = await syncBookingToHubspot(booking);
    await recordBookingHubspotSync(booking.id, hubspotResult);
    if (!hubspotResult.ok && adminTo) {
      const failureEmail = hubspotSyncFailureEmail({
        leadType: "consultation",
        leadId: booking.id,
        customerName: booking.full_name,
        customerEmail: booking.email,
        errorMessage: hubspotResult.error,
      });
      await sendEmail({
        to: adminTo,
        subject: failureEmail.subject,
        html: failureEmail.html,
      });
    }

    // SCRUM-86: duplicate detection. Best-effort, never throws (AC#5).
    await detectAndFlagDuplicate({
      leadType: "consultation",
      leadId: booking.id,
      email: booking.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your consultation request has been received. We'll be in touch soon.",
        booking: {
          id: booking.id,
          full_name: booking.full_name,
          email: booking.email,
          preferred_date: booking.preferred_date,
          preferred_time: booking.preferred_time,
          created_at: booking.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}

// ─── Admin Handlers ──────────────────────────────────────────

export async function listBookingsHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listBookingsQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const bookings = await listBookings(parsed.data);

    return NextResponse.json({ bookings, count: bookings.length });
  } catch (err) {
    return handleError(err);
  }
}

export async function getBookingHandler(id: string) {
  try {
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateBookingHandler(
  req: Request,
  id: string,
  adminId?: string
) {
  try {
    const body = await req.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const updated = await updateBooking(id, parsed.data);

    // SCRUM-83: status change → record history (AC#3) + sync HubSpot (AC#5).
    if (parsed.data.status && parsed.data.status !== existing.status) {
      await recordStatusChange({
        leadType: "consultation",
        leadId: id,
        fromStatus: existing.status,
        toStatus: parsed.data.status,
        changedBy: adminId ?? null,
      });
      if (existing.hubspot_contact_id) {
        await syncStatusToHubspot({
          hubspotContactId: existing.hubspot_contact_id,
          newStatus: parsed.data.status,
        });
      }
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteBookingHandler(id: string) {
  try {
    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    await deleteBooking(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}