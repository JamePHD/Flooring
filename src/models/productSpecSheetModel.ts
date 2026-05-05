import { createAdminClient } from "../lib/supabase/admin";

// ─── Constants ───────────────────────────────────────────────

export const SPEC_SHEET_BUCKET = "product-spec-sheets";
export const MAX_SHEETS_PER_PRODUCT = 10;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPE = "application/pdf";

// ─── Types ───────────────────────────────────────────────────

export interface ProductSpecSheet {
  id: string;
  product_id: string;
  file_url: string;
  // Nullable for legacy rows migrated from products.spec_sheet_url
  // (the file lives outside our bucket so we have no path to it).
  storage_path: string | null;
  file_name: string;
  label: string | null;
  file_size_bytes: number;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadSheetInput {
  productId: string;
  productSlug: string;
  fileBuffer: Buffer;
  fileName: string;
  fileSize: number;
  label: string;
  sortOrder: number;
  uploadedBy: string;
}

export interface UpdateSheetInput {
  label?: string;
  sort_order?: number;
}

// ─── Helpers ─────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  const basename = name.split(/[/\\]/).pop() || "file.pdf";
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

// ─── Queries ─────────────────────────────────────────────────

// Public product lookup uses slug (matches existing /api/products/[slug] convention).
// Returns the product's UUID, or null if no active product with that slug exists.
export async function getProductIdBySlug(slug: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw { message: "Failed to look up product by slug", status: 500 };
  return data?.id ?? null;
}

// Reverse lookup: id → slug. Used by the upload handler to build the storage
// path as {slug}/{timestamp}-{filename} per AC#3.
export async function getProductSlugById(productId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw { message: "Failed to look up product slug", status: 500 };
  return data?.slug ?? null;
}

export async function productExists(productId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw { message: "Failed to check product", status: 500 };
  return data !== null;
}

export async function listSheetsByProduct(
  productId: string
): Promise<ProductSpecSheet[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw { message: "Failed to list spec sheets", status: 500 };
  return data as ProductSpecSheet[];
}

export async function getSheetById(
  id: string
): Promise<ProductSpecSheet | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch spec sheet", status: 500 };
  return data as ProductSpecSheet | null;
}

export async function countSheetsForProduct(
  productId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("product_spec_sheets")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw { message: "Failed to count spec sheets", status: 500 };
  return count ?? 0;
}

// Uploads the file to storage AND inserts the DB row. If the DB insert fails,
// the storage object is deleted to avoid orphan files.
// Storage path: {product-slug}/{timestamp}-{filename} per AC#3.
export async function uploadSheet(
  input: UploadSheetInput
): Promise<ProductSpecSheet> {
  const supabase = createAdminClient();
  const safeName = sanitizeFilename(input.fileName);
  const timestamp = Date.now();
  const storagePath = `${input.productSlug}/${timestamp}-${safeName}`;

  // 1. Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from(SPEC_SHEET_BUCKET)
    .upload(storagePath, input.fileBuffer, {
      contentType: ALLOWED_MIME_TYPE,
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError) {
    throw {
      message: `Storage upload failed: ${uploadError.message}`,
      status: 500,
    };
  }

  // 2. Get the public URL
  const { data: urlData } = supabase.storage
    .from(SPEC_SHEET_BUCKET)
    .getPublicUrl(storagePath);

  // 3. Insert DB row
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .insert({
      product_id: input.productId,
      file_url: urlData.publicUrl,
      storage_path: storagePath,
      file_name: safeName,
      label: input.label,
      file_size_bytes: input.fileSize,
      sort_order: input.sortOrder,
      uploaded_by: input.uploadedBy,
    })
    .select()
    .single();

  if (error) {
    // Roll back the storage upload to avoid orphan files (AC#9)
    await supabase.storage.from(SPEC_SHEET_BUCKET).remove([storagePath]);
    throw {
      message: error.message || "Failed to create spec sheet record",
      status: 500,
    };
  }
  return data as ProductSpecSheet;
}

// Deletes BOTH the storage file and the DB row. AC#7: "no orphan files".
export async function deleteSheet(id: string): Promise<void> {
  const supabase = createAdminClient();

  const sheet = await getSheetById(id);
  if (!sheet) throw { message: "Spec sheet not found", status: 404 };

  // Storage delete is best-effort; DB delete is the source of truth.
  // If storage delete fails (e.g. file already gone), we still proceed
  // with the DB delete so the row doesn't linger pointing at nothing.
  // Legacy migrated rows (from the SCRUM-50 → 68 data migration) have
  // null storage_path because the file lives at an arbitrary URL outside
  // our bucket — skip storage delete for those.
  if (sheet.storage_path) {
    await supabase.storage
      .from(SPEC_SHEET_BUCKET)
      .remove([sheet.storage_path]);
  }

  const { error } = await supabase
    .from("product_spec_sheets")
    .delete()
    .eq("id", id);
  if (error) {
    throw {
      message: error.message || "Failed to delete spec sheet record",
      status: 500,
    };
  }
}

export async function updateSheet(
  id: string,
  input: UpdateSheetInput
): Promise<ProductSpecSheet> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw {
      message: error.message || "Failed to update spec sheet",
      status: 400,
    };
  }
  return data as ProductSpecSheet;
}
