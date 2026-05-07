import { NextResponse } from "next/server";
import { z } from "zod";
import {
  LeadType,
  addLeadNote,
  deleteLeadNote,
  dismissDuplicateFlag,
  getLeadNoteById,
  listLeadNotes,
  listLeads,
  listStatusHistory,
  markBookingRead,
  markQuoteRead,
  mergeLeads,
} from "../models/lead.model";

// ─── Validation ──────────────────────────────────────────────

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const listLeadsQuerySchema = z
  .object({
    type: z.enum(["quote", "consultation"]).optional(),
    status: z.string().trim().min(1).max(50).optional(),
    unread_only: z
      .union([z.literal("true"), z.literal("false"), z.boolean()])
      .optional()
      .transform((v) => v === true || v === "true"),
    date_from: isoDate.optional(),
    date_to: isoDate.optional(),
    // SCRUM-84
    search: z.string().trim().min(1).max(200).optional(),
    user_path: z
      .enum(["diy_homeowner", "architect_designer", "property_investor"])
      .optional(),
    product_interest: z.string().trim().min(1).max(200).optional(),
    limit: z.coerce.number().int().positive().max(500).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (d) =>
      !d.date_from || !d.date_to || d.date_from <= d.date_to,
    {
      message: "date_from must be on or before date_to",
      path: ["date_from"],
    }
  );

const leadTypeSchema = z.enum(["quote", "consultation"]);

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
      search: searchParams.get("search") ?? undefined,
      user_path: searchParams.get("user_path") ?? undefined,
      product_interest: searchParams.get("product_interest") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      // AC#7: date_from > date_to → 400
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const leads = await listLeads(parsed.data);
    return NextResponse.json({ leads, count: leads.length });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/leads/[type]/[id]/read
export async function markLeadReadHandler(typeParam: string, id: string) {
  try {
    // AC#12: invalid type → 400
    const typeParsed = leadTypeSchema.safeParse(typeParam);
    if (!typeParsed.success) {
      return NextResponse.json(
        {
          error: `Invalid lead type "${typeParam}". Must be "quote" or "consultation".`,
        },
        { status: 400 }
      );
    }
    const type: LeadType = typeParsed.data;

    const result =
      type === "quote" ? await markQuoteRead(id) : await markBookingRead(id);

    // AC#13: non-existent lead → 404
    if (!result.found) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // AC#11: idempotent — `changed: false` when already read.
    return NextResponse.json({
      success: true,
      type,
      id,
      read_at: result.read_at,
      changed: result.changed,
    });
  } catch (err) {
    return handleError(err);
  }
}

// ─── SCRUM-83 status history (AC#3) ──────────────────────────

// GET /api/admin/leads/[type]/[id]/history
export async function leadHistoryHandler(typeParam: string, leadId: string) {
  try {
    const typeParsed = leadTypeSchema.safeParse(typeParam);
    if (!typeParsed.success) {
      return NextResponse.json(
        { error: `Invalid lead type "${typeParam}"` },
        { status: 400 }
      );
    }
    const history = await listStatusHistory(typeParsed.data, leadId);
    return NextResponse.json({ history, count: history.length });
  } catch (err) {
    return handleError(err);
  }
}

// ─── SCRUM-83 lead notes (AC#4) ──────────────────────────────

const noteBodySchema = z.object({
  body: z.string().trim().min(1, "Note body is required").max(5000),
});

// GET /api/admin/leads/[type]/[id]/notes
export async function listLeadNotesHandler(typeParam: string, leadId: string) {
  try {
    const typeParsed = leadTypeSchema.safeParse(typeParam);
    if (!typeParsed.success) {
      return NextResponse.json(
        { error: `Invalid lead type "${typeParam}"` },
        { status: 400 }
      );
    }
    const notes = await listLeadNotes(typeParsed.data, leadId);
    return NextResponse.json({ notes, count: notes.length });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/admin/leads/[type]/[id]/notes
export async function addLeadNoteHandler(
  req: Request,
  typeParam: string,
  leadId: string,
  adminId: string
) {
  try {
    const typeParsed = leadTypeSchema.safeParse(typeParam);
    if (!typeParsed.success) {
      return NextResponse.json(
        { error: `Invalid lead type "${typeParam}"` },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = noteBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const note = await addLeadNote({
      leadType: typeParsed.data,
      leadId,
      body: parsed.data.body,
      authorId: adminId,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/leads/[type]/[id]/notes/[noteId]
// The [type] and [id] in the URL are validated against the note's actual
// lead_type / lead_id to prevent cross-lead deletion attempts.
export async function deleteLeadNoteHandler(
  typeParam: string,
  leadId: string,
  noteId: string
) {
  try {
    const typeParsed = leadTypeSchema.safeParse(typeParam);
    if (!typeParsed.success) {
      return NextResponse.json(
        { error: `Invalid lead type "${typeParam}"` },
        { status: 400 }
      );
    }

    const note = await getLeadNoteById(noteId);
    if (
      !note ||
      note.lead_type !== typeParsed.data ||
      note.lead_id !== leadId
    ) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await deleteLeadNote(noteId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}

// ─── SCRUM-86 Duplicate flag — dismiss + merge (AC#4) ────────

// POST /api/admin/leads/[type]/[id]/dismiss-duplicate
export async function dismissDuplicateHandler(
  typeParam: string,
  leadId: string,
  adminId: string
) {
  try {
    const typeParsed = leadTypeSchema.safeParse(typeParam);
    if (!typeParsed.success) {
      return NextResponse.json(
        { error: `Invalid lead type "${typeParam}"` },
        { status: 400 }
      );
    }
    const result = await dismissDuplicateFlag(typeParsed.data, leadId, adminId);
    if (!result.found) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}

const mergeBodySchema = z.object({
  primary: z.object({
    lead_type: leadTypeSchema,
    id: z.string().uuid(),
  }),
  duplicate: z.object({
    lead_type: leadTypeSchema,
    id: z.string().uuid(),
  }),
});

// POST /api/admin/leads/merge
// Body: { primary: { lead_type, id }, duplicate: { lead_type, id } }
// Re-parents the duplicate's notes + status history onto the primary,
// then deletes the duplicate row. Convention: pick the OLDER lead as
// the primary, but the endpoint accepts whatever the admin sends.
export async function mergeLeadsHandler(req: Request, adminId: string) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = mergeBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const result = await mergeLeads({
      primary: parsed.data.primary,
      duplicate: parsed.data.duplicate,
      adminId,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return handleError(err);
  }
}
