import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listLeads,
  markQuoteRead,
  markBookingRead,
  leadExists,
  LeadType,
} from "../models/lead.model";

// ─── Validation Schemas ──────────────────────────────────────

const leadTypeSchema = z.enum(["quote", "consultation"]);

const leadStatusSchema = z.enum([
  "pending",
  "contacted",
  "in_progress",
  "closed",
]);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

const listLeadsQuerySchema = z
  .object({
    type: leadTypeSchema.optional(),
    status: leadStatusSchema.optional(),
    unread_only: z.coerce.boolean().optional(),
    date_from: isoDateSchema.optional(),
    date_to: isoDateSchema.optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (data) => !(data.date_from && data.date_to) || data.date_from <= data.date_to,
    { message: "date_from must be on or before date_to", path: ["date_from"] }
  );

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

// ─── Handlers ────────────────────────────────────────────────

// GET /api/admin/leads
export async function listLeadsHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listLeadsQuerySchema.safeParse({
      type: searchParams.get("type") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      unread_only: searchParams.get("unread_only") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const leads = await listLeads(parsed.data);

    return NextResponse.json({
      leads,
      count: leads.length,
      filters: parsed.data,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/leads/[type]/[id]/read
export async function markLeadReadHandler(type: string, id: string) {
  try {
    const parsedType = leadTypeSchema.safeParse(type);
    if (!parsedType.success) {
      return NextResponse.json(
        { error: "Invalid lead type. Must be 'quote' or 'consultation'." },
        { status: 400 }
      );
    }

    const exists = await leadExists(parsedType.data, id);
    if (!exists) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (parsedType.data === "quote") {
      await markQuoteRead(id);
    } else {
      await markBookingRead(id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}