import { NextResponse } from "next/server";
import { sendEmail } from "../lib/email/send";
import { ADMIN_EMAIL } from "../lib/email/client";
import { QuoteConfirmation } from "../emails/QuoteConfirmation";
import { AdminQuoteNotification } from "../emails/AdminQuoteNotification";
import { z } from "zod";
import {
  createQuote,
  getQuoteById,
  listQuotes,
  updateQuote,
  deleteQuote,
} from "../models/quote.model";

// ─── Validation Schemas ──────────────────────────────────────

const userPathSchema = z.enum([
  "diy_homeowner",
  "architect_designer",
  "property_investor",
]);

const contactMethodSchema = z.enum(["email", "phone", "either"]);

const quoteStatusSchema = z.enum([
  "pending",
  "contacted",
  "quoted",
  "won",
  "lost",
  "expired",
]);

const selectedProductSchema = z.object({
  product_id: z.string().uuid("Invalid product_id"),
  variant_id: z.string().uuid().optional(),
});

// Public: quote submission
const createQuoteSchema = z
  .object({
    full_name: z.string().trim().min(1, "Name is required").max(200),
    email: z.string().trim().toLowerCase().email("Invalid email").max(255),
    phone: z.string().trim().min(6, "Phone is required").max(40),
    selected_products: z
      .array(selectedProductSchema)
      .min(1, "At least one product must be selected")
      .max(20),
    square_meterage: z.coerce.number().positive().max(100000),
    room_type: z.string().trim().min(1).max(100),
    project_description: z.string().trim().min(10).max(5000),
    preferred_contact_method: contactMethodSchema,
    preferred_timeframe: z.string().trim().min(1).max(100),
    num_properties: z.coerce.number().int().positive().max(10000).optional(),
    total_sqm: z.coerce.number().positive().max(1000000).optional(),
    session_token: z.string().uuid().optional(),
    user_path: userPathSchema.optional(),
  })
  .refine(
    (data) => {
      // Investor path: both num_properties and total_sqm required (per team decision)
      if (data.user_path === "property_investor") {
        return data.num_properties !== undefined && data.total_sqm !== undefined;
      }
      return true;
    },
    {
      message: "Property investor path requires both num_properties and total_sqm",
      path: ["user_path"],
    }
  );

// Admin: status / notes updates
const updateQuoteSchema = z
  .object({
    status: quoteStatusSchema.optional(),
    admin_notes: z.string().max(5000).optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.admin_notes !== undefined,
    { message: "At least one field (status or admin_notes) must be provided" }
  );

// Admin: list query params
const listQuotesQuerySchema = z.object({
  status: quoteStatusSchema.optional(),
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

// ─── Public Handlers ─────────────────────────────────────────

// POST /api/quotes
export async function createQuoteHandler(req: Request) {
  try {
    const body = await req.json();
    const parsed = createQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quote = await createQuote(parsed.data);

    Promise.all([
  sendEmail({
    to: quote.email,
    subject: "Your quote request has been received",
    template: QuoteConfirmation({
      fullName: quote.full_name,
      email: quote.email,
      phone: quote.phone,
      squareMeterage: quote.square_meterage,
      roomType: quote.room_type,
      preferredTimeframe: quote.preferred_timeframe,
      productCount: quote.selected_products.length,
    }),
  }),
  sendEmail({
    to: ADMIN_EMAIL,
    subject: `New quote request from ${quote.full_name}`,
    template: AdminQuoteNotification({
      quoteId: quote.id,
      fullName: quote.full_name,
      email: quote.email,
      phone: quote.phone,
      squareMeterage: quote.square_meterage,
      roomType: quote.room_type,
      projectDescription: quote.project_description,
      preferredContactMethod: quote.preferred_contact_method,
      preferredTimeframe: quote.preferred_timeframe,
      productCount: quote.selected_products.length,
      userPath: quote.user_path,
      numProperties: quote.num_properties,
      totalSqm: quote.total_sqm,
    }),
    replyTo: quote.email, // admin can reply directly to customer
  }),
]).catch((err) => console.error("[email] Quote emails failed:", err));

    // Don't expose internal status/admin_notes/id in the public response.
    return NextResponse.json(
      {
        success: true,
        message:
          "Your quote request has been received. We'll be in touch shortly with pricing details.",
        quote: {
          id: quote.id,
          full_name: quote.full_name,
          email: quote.email,
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

// GET /api/admin/quotes
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

// GET /api/admin/quotes/[id]
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

// PATCH /api/admin/quotes/[id]
export async function updateQuoteHandler(req: Request, id: string) {
  try {
    const body = await req.json();
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

// DELETE /api/admin/quotes/[id]
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