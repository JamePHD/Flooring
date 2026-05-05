import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createQuote,
  deleteQuote,
  getQuoteById,
  listQuotes,
  updateQuote,
} from "../models/quote.model";

// ─── Validation Schemas ──────────────────────────────────────

const userPathSchema = z.enum([
  "diy_homeowner",
  "architect_designer",
  "property_investor",
]);

const statusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

const selectedProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(500).optional(),
  quantity_sqm: z.number().positive().max(1_000_000).optional(),
});

// AC#2: investor variant requires num_properties AND total_sqm.
// AC#3: selected_products must have at least one entry.
const createQuoteSchema = z
  .object({
    user_path: userPathSchema,
    full_name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z.string().trim().max(50).optional(),
    selected_products: z
      .array(selectedProductSchema)
      .min(1, "At least one selected product is required"),
    num_properties: z.number().int().positive().max(10000).optional(),
    total_sqm: z.number().positive().max(10_000_000).optional(),
    customer_notes: z.string().trim().max(5000).optional(),
    session_token: z.string().trim().max(200).optional(),
  })
  .refine(
    (data) =>
      data.user_path !== "property_investor" ||
      (data.num_properties !== undefined && data.total_sqm !== undefined),
    {
      message:
        "user_path 'property_investor' requires both num_properties and total_sqm",
      path: ["num_properties"],
    }
  );

const updateQuoteSchema = z
  .object({
    status: statusSchema.optional(),
    admin_notes: z.string().max(5000).optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.admin_notes !== undefined,
    { message: "At least one field (status or admin_notes) must be provided" }
  );

const listQuotesQuerySchema = z.object({
  status: statusSchema.optional(),
  user_path: userPathSchema.optional(),
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

// ─── Public Handler ──────────────────────────────────────────

export async function createQuoteHandler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quote = await createQuote(parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Your quote request has been received. We'll be in touch soon.",
        quote: {
          id: quote.id,
          user_path: quote.user_path,
          status: quote.status,
          session_token: quote.session_token,
          created_at: quote.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}

// ─── Admin Handlers ──────────────────────────────────────────

export async function listQuotesHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listQuotesQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      user_path: searchParams.get("user_path") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quotes = await listQuotes(parsed.data);
    return NextResponse.json({ quotes, count: quotes.length });
  } catch (err) {
    return handleError(err);
  }
}

export async function getQuoteHandler(id: string) {
  try {
    const quote = await getQuoteById(id);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json({ quote });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateQuoteHandler(req: Request, id: string) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = updateQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getQuoteById(id);
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const updated = await updateQuote(id, parsed.data);
    return NextResponse.json({ quote: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteQuoteHandler(id: string) {
  try {
    const existing = await getQuoteById(id);
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    await deleteQuote(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
