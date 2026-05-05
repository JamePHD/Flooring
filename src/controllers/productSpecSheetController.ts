import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listSpecSheets,
  createSpecSheet,
  updateSpecSheet,
  deleteSpecSheet,
  getSpecSheetById,
} from "../models/product.model";
import { createAdminClient } from "../lib/supabase/admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["application/pdf"];

// ─── Validation Schemas ──────────────────────────────────────

const updateSpecSheetSchema = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
    sort_order: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (data) => data.label !== undefined || data.sort_order !== undefined,
    { message: "At least one of label or sort_order must be provided" }
  );

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

async function getProductSlug(productId: string): Promise<{ slug: string } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw { message: "Failed to fetch product", status: 500 };
  return data;
}

// ─── Public Handlers ─────────────────────────────────────────

// GET /api/products/[id]/spec-sheets — list spec sheets for a product
export async function listSpecSheetsHandler(productId: string) {
  try {
    const sheets = await listSpecSheets(productId);
    return NextResponse.json({ spec_sheets: sheets, count: sheets.length });
  } catch (err) {
    return handleError(err);
  }
}

// ─── Admin Handlers ──────────────────────────────────────────

// POST /api/admin/products/[id]/spec-sheets — upload a new spec sheet
// multipart/form-data with fields "file" and "label"
export async function createSpecSheetHandler(req: Request, productId: string) {
  try {
    const product = await getProductSlug(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart/form-data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const label = formData.get("label");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded. Use form field 'file'." },
        { status: 400 }
      );
    }

    if (typeof label !== "string" || label.trim().length === 0) {
      return NextResponse.json(
        { error: "Label is required. Use form field 'label'." },
        { status: 400 }
      );
    }

    if (label.length > 100) {
      return NextResponse.json(
        { error: "Label must be 100 characters or fewer" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    const sheet = await createSpecSheet({
      product_id: productId,
      product_slug: product.slug,
      label: label.trim(),
      file_buffer: buffer,
      file_name: file.name,
      content_type: file.type,
    });

    return NextResponse.json({ spec_sheet: sheet }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/products/[id]/spec-sheets/[sheetId] — update label or sort
export async function updateSpecSheetHandler(
  req: Request,
  productId: string,
  sheetId: string
) {
  try {
    const existing = await getSpecSheetById(sheetId);
    if (!existing || existing.product_id !== productId) {
      return NextResponse.json({ error: "Spec sheet not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSpecSheetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateSpecSheet(sheetId, parsed.data);
    return NextResponse.json({ spec_sheet: updated });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/products/[id]/spec-sheets/[sheetId]
export async function deleteSpecSheetHandler(productId: string, sheetId: string) {
  try {
    const existing = await getSpecSheetById(sheetId);
    if (!existing || existing.product_id !== productId) {
      return NextResponse.json({ error: "Spec sheet not found" }, { status: 404 });
    }

    await deleteSpecSheet(sheetId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}