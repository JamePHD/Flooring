import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ALLOWED_MIME_TYPE,
  MAX_FILE_SIZE_BYTES,
  MAX_SHEETS_PER_PRODUCT,
  ProductSpecSheet,
  deleteSheet,
  getProductSlugById,
  getSheetById,
  listSheetsByProduct,
  productExists,
  updateSheet,
  uploadSheet,
} from "../models/productSpecSheetModel";

const MAX_LABEL_LENGTH = 100;

// ─── Validation ──────────────────────────────────────────────

const updateSchema = z
  .object({
    label: z.string().trim().min(1).max(MAX_LABEL_LENGTH).optional(),
    sort_order: z.number().int().min(0).max(10000).optional(),
  })
  .refine(
    (data) => data.label !== undefined || data.sort_order !== undefined,
    { message: "At least one field (label or sort_order) must be provided" }
  );

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

function publicView(sheet: ProductSpecSheet) {
  return {
    id: sheet.id,
    file_url: sheet.file_url,
    file_name: sheet.file_name,
    label: sheet.label,
    sort_order: sheet.sort_order,
  };
}

function adminView(sheet: ProductSpecSheet) {
  return {
    id: sheet.id,
    product_id: sheet.product_id,
    file_url: sheet.file_url,
    file_name: sheet.file_name,
    label: sheet.label,
    file_size_bytes: sheet.file_size_bytes,
    sort_order: sheet.sort_order,
    uploaded_by: sheet.uploaded_by,
    created_at: sheet.created_at,
    updated_at: sheet.updated_at,
  };
}

// ─── Handlers ────────────────────────────────────────────────

// POST /api/admin/products/[id]/spec-sheets
export async function uploadSheetHandler(
  req: Request,
  productId: string,
  adminId: string
) {
  try {
    if (!(await productExists(productId))) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Use length of the actual list rather than a HEAD count query —
    // the head:true count call was returning null in this Supabase setup,
    // letting the cap silently leak. Listing is fine for max-10 rows.
    const existing = await listSheetsByProduct(productId);
    if (existing.length >= MAX_SHEETS_PER_PRODUCT) {
      return NextResponse.json(
        {
          error: `Spec sheet cap reached: a product may have at most ${MAX_SHEETS_PER_PRODUCT} sheets`,
        },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Request body must be multipart/form-data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const labelRaw = formData.get("label");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing required field: file" },
        { status: 400 }
      );
    }

    // AC#4: label is required, non-empty, max 100 chars
    if (typeof labelRaw !== "string") {
      return NextResponse.json(
        { error: "Missing required field: label" },
        { status: 400 }
      );
    }
    const label = labelRaw.trim();
    if (label.length === 0) {
      return NextResponse.json(
        { error: "Label cannot be empty" },
        { status: 400 }
      );
    }
    if (label.length > MAX_LABEL_LENGTH) {
      return NextResponse.json(
        { error: `Label exceeds ${MAX_LABEL_LENGTH} character limit` },
        { status: 400 }
      );
    }

    if (file.type !== ALLOWED_MIME_TYPE) {
      return NextResponse.json(
        {
          error: `Only ${ALLOWED_MIME_TYPE} files are allowed; got ${file.type || "unknown"}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File exceeds ${MAX_FILE_SIZE_BYTES} byte limit (got ${file.size} bytes)`,
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty" },
        { status: 400 }
      );
    }

    // AC#3: storage path uses {product-slug}/{timestamp}-{name}
    const productSlug = await getProductSlugById(productId);
    if (!productSlug) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // AC#3: sort_order appended to end (highest existing + 1, or 0 if none)
    const nextSortOrder =
      existing.length === 0
        ? 0
        : Math.max(...existing.map((s) => s.sort_order)) + 1;

    const buffer = Buffer.from(await file.arrayBuffer());
    const sheet = await uploadSheet({
      productId,
      productSlug,
      fileBuffer: buffer,
      fileName: file.name || "spec-sheet.pdf",
      fileSize: file.size,
      label,
      sortOrder: nextSortOrder,
      uploadedBy: adminId,
    });

    return NextResponse.json(adminView(sheet), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/products/[id]/spec-sheets  (public)
// AC#2: returns empty array (not 404) for products with no sheets,
// includes count alongside the array. Non-existent products still 404
// (verified at the route layer via slug→id lookup).
export async function listSheetsPublicHandler(productId: string) {
  try {
    if (!(await productExists(productId))) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    const sheets = await listSheetsByProduct(productId);
    const view = sheets.map(publicView);
    return NextResponse.json({ sheets: view, count: view.length });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/admin/products/[id]/spec-sheets  (auth)
export async function listSheetsAdminHandler(productId: string) {
  try {
    if (!(await productExists(productId))) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    const sheets = await listSheetsByProduct(productId);
    const view = sheets.map(adminView);
    return NextResponse.json({ sheets: view, count: view.length });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/products/[id]/spec-sheets/[sheetId]
export async function deleteSheetHandler(productId: string, sheetId: string) {
  try {
    const sheet = await getSheetById(sheetId);
    if (!sheet || sheet.product_id !== productId) {
      return NextResponse.json(
        { error: "Spec sheet not found" },
        { status: 404 }
      );
    }
    await deleteSheet(sheetId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/products/[id]/spec-sheets/[sheetId]
export async function updateSheetHandler(
  req: Request,
  productId: string,
  sheetId: string
) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getSheetById(sheetId);
    if (!existing || existing.product_id !== productId) {
      return NextResponse.json(
        { error: "Spec sheet not found" },
        { status: 404 }
      );
    }

    const updated = await updateSheet(sheetId, parsed.data);
    return NextResponse.json(adminView(updated));
  } catch (err) {
    return handleError(err);
  }
}
