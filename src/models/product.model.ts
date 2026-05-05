import { createAdminClient } from "../lib/supabase/admin";
import { createServerClient } from "../lib/supabase/server";

// ─── Constants ───────────────────────────────────────────────

const SPEC_SHEET_BUCKET = "product-spec-sheets";
const MAX_SPEC_SHEETS_PER_PRODUCT = 10;

// ─── Types ───────────────────────────────────────────────────

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  colour_name: string | null;
  colour_hex: string | null;
  size_label: string | null;
  price_per_sqm: number | null;
  price_per_unit: number | null;
  stock_status: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  attributes: {
    id: string;
    attribute_id: string;
    value: string;
  }[];
  category: { id: string; name: string; slug: string } | null;
}

export interface CreateProductInput {
  category_id?: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  short_description?: string;
  image_url?: string;
}

export interface UpdateProductInput {
  category_id?: string;
  name?: string;
  slug?: string;
  brand?: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface CreateVariantInput {
  product_id: string;
  sku: string;
  colour_name?: string;
  colour_hex?: string;
  size_label?: string;
  price_per_sqm?: number;
  price_per_unit?: number;
  stock_status?: number;
  image_url?: string;
  sort_order?: number;
}

export interface UpdateVariantInput {
  sku?: string;
  colour_name?: string;
  colour_hex?: string;
  size_label?: string;
  price_per_sqm?: number;
  price_per_unit?: number;
  stock_status?: number;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductSpecSheet {
  id: string;
  product_id: string;
  label: string;
  file_url: string;
  file_name: string | null;
  file_size_bytes: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSpecSheetInput {
  product_id: string;
  product_slug: string;
  label: string;
  file_buffer: ArrayBuffer;
  file_name: string;
  content_type: string;
}

export interface UpdateSpecSheetInput {
  label?: string;
  sort_order?: number;
}

// ─── Storage Helpers ─────────────────────────────────────────

function buildSpecSheetPath(productSlug: string, fileName: string): string {
  // Sanitise filename to prevent path traversal and weird chars
  const safe = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${productSlug}/${Date.now()}-${safe}`;
}

function extractPathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${SPEC_SHEET_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

// ─── Public Queries ──────────────────────────────────────────

export async function getActiveProducts(filters?: {
  category_slug?: string;
  brand?: string;
  search?: string;
}): Promise<Product[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("products")
    .select("*, categories(slug)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (filters?.category_slug) {
    query = query.eq("categories.slug", filters.category_slug);
  }
  if (filters?.brand) {
    query = query.eq("brand", filters.brand);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw { message: "Failed to fetch products", status: 500 };
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = createServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) return null;

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: attributes } = await supabase
    .from("product_attributes")
    .select("*")
    .eq("product_id", product.id);

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("id", product.category_id)
    .single();

  return {
    ...product,
    variants: variants || [],
    attributes: attributes || [],
    category: category || null,
  } as ProductWithDetails;
}

// ─── Admin Queries ───────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw { message: "Failed to fetch products", status: 500 };
  return data as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create product", status: 400 };
  return data as Product;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update product", status: 400 };
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw { message: error.message || "Failed to delete product", status: 400 };
}

// ─── Variant Queries ─────────────────────────────────────────

export async function createVariant(input: CreateVariantInput): Promise<ProductVariant> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create variant", status: 400 };
  return data as ProductVariant;
}

export async function updateVariant(id: string, input: UpdateVariantInput): Promise<ProductVariant> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update variant", status: 400 };
  return data as ProductVariant;
}

export async function deleteVariant(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);

  if (error) throw { message: error.message || "Failed to delete variant", status: 400 };
}

// ─── Filtered Search (Comparison Engine) ─────────────────────

export async function getFilteredProducts(filters: {
  category_slugs?: string[];
  brands?: string[];
  search?: string;
  min_price?: number;
  max_price?: number;
  attributes?: { attribute_id: string; value: string }[];
  sort_by?: "name" | "price_low" | "price_high";
  page?: number;
  per_page?: number;
}): Promise<{ products: Product[]; total: number }> {
  const supabase = createServerClient();
  const page = filters.page || 1;
  const perPage = filters.per_page || 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("products")
    .select("*, categories!inner(slug, name)", { count: "exact" })
    .eq("is_active", true);

  if (filters.category_slugs && filters.category_slugs.length > 0) {
    query = query.in("categories.slug", filters.category_slugs);
  }

  if (filters.brands && filters.brands.length > 0) {
    query = query.in("brand", filters.brands);
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  query = query.range(offset, offset + perPage - 1);
  query = query.order("name", { ascending: true });

  const { data: products, error, count } = await query;

  if (error) throw { message: "Failed to fetch filtered products", status: 500 };

  let filteredProducts = products as Product[];

  // Price filtering — needs variant lookup
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    const productIds = filteredProducts.map((p) => p.id);

    if (productIds.length > 0) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id, price_per_sqm, price_per_unit")
        .in("product_id", productIds)
        .eq("is_active", true);

      const productPriceMap = new Map<string, number>();
      (variants || []).forEach((v: any) => {
        const price = v.price_per_sqm || v.price_per_unit || 0;
        const current = productPriceMap.get(v.product_id);
        if (!current || price < current) {
          productPriceMap.set(v.product_id, price);
        }
      });

      filteredProducts = filteredProducts.filter((p) => {
        const price = productPriceMap.get(p.id);
        if (price === undefined) return false;
        if (filters.min_price !== undefined && price < filters.min_price) return false;
        if (filters.max_price !== undefined && price > filters.max_price) return false;
        return true;
      });
    }
  }

  // Attribute filtering
  if (filters.attributes && filters.attributes.length > 0) {
    const productIds = filteredProducts.map((p) => p.id);

    if (productIds.length > 0) {
      const { data: productAttrs } = await supabase
        .from("product_attributes")
        .select("product_id, attribute_id, value")
        .in("product_id", productIds);

      filteredProducts = filteredProducts.filter((p) => {
        return filters.attributes!.every((filter) => {
          const match = (productAttrs || []).find(
            (pa: any) =>
              pa.product_id === p.id &&
              pa.attribute_id === filter.attribute_id &&
              pa.value === filter.value
          );
          return !!match;
        });
      });
    }
  }

  return {
    products: filteredProducts,
    total: count || 0,
  };
}

export async function getAvailableBrands(): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);

  if (error) throw { message: "Failed to fetch brands", status: 500 };

  const brands: string[] = (data || []).map((d: any) => d.brand as string);
  const uniqueBrands = [...new Set(brands)];
  return uniqueBrands.sort();
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("price_per_sqm, price_per_unit")
    .eq("is_active", true);

  if (error) throw { message: "Failed to fetch price range", status: 500 };

  let min = Infinity;
  let max = 0;

  (data || []).forEach((v: any) => {
    const price = v.price_per_sqm || v.price_per_unit || 0;
    if (price > 0 && price < min) min = price;
    if (price > max) max = price;
  });

  return { min: min === Infinity ? 0 : min, max };
}

// ─── Spec Sheets (SCRUM-68) ──────────────────────────────────

export async function listSpecSheets(productId: string): Promise<ProductSpecSheet[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw { message: "Failed to fetch spec sheets", status: 500 };
  return data as ProductSpecSheet[];
}

export async function countSpecSheets(productId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("product_spec_sheets")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) throw { message: "Failed to count spec sheets", status: 500 };
  return count ?? 0;
}

export async function createSpecSheet(input: CreateSpecSheetInput): Promise<ProductSpecSheet> {
  const supabase = createAdminClient();

  const existingCount = await countSpecSheets(input.product_id);
  if (existingCount >= MAX_SPEC_SHEETS_PER_PRODUCT) {
    throw {
      message: `Maximum of ${MAX_SPEC_SHEETS_PER_PRODUCT} spec sheets per product reached`,
      status: 400,
    };
  }

  const path = buildSpecSheetPath(input.product_slug, input.file_name);
  const { error: uploadError } = await supabase.storage
    .from(SPEC_SHEET_BUCKET)
    .upload(path, input.file_buffer, {
      contentType: input.content_type,
      upsert: false,
    });

  if (uploadError) {
    throw { message: `Failed to upload file: ${uploadError.message}`, status: 500 };
  }

  const { data: publicUrlData } = supabase.storage
    .from(SPEC_SHEET_BUCKET)
    .getPublicUrl(path);

  const { data, error: insertError } = await supabase
    .from("product_spec_sheets")
    .insert({
      product_id: input.product_id,
      label: input.label,
      file_url: publicUrlData.publicUrl,
      file_name: input.file_name,
      file_size_bytes: input.file_buffer.byteLength,
      sort_order: existingCount,
    })
    .select()
    .single();

  if (insertError) {
    // Roll back storage upload to avoid orphaned files
    await supabase.storage.from(SPEC_SHEET_BUCKET).remove([path]);
    throw { message: insertError.message || "Failed to create spec sheet record", status: 500 };
  }

  return data as ProductSpecSheet;
}

export async function updateSpecSheet(
  id: string,
  input: UpdateSpecSheetInput
): Promise<ProductSpecSheet> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update spec sheet", status: 400 };
  return data as ProductSpecSheet;
}

export async function deleteSpecSheet(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: row, error: fetchError } = await supabase
    .from("product_spec_sheets")
    .select("file_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw { message: "Failed to fetch spec sheet", status: 500 };
  if (!row) throw { message: "Spec sheet not found", status: 404 };

  const { error: deleteError } = await supabase
    .from("product_spec_sheets")
    .delete()
    .eq("id", id);

  if (deleteError) throw { message: deleteError.message || "Failed to delete spec sheet", status: 400 };

  // Best-effort file cleanup
  const path = extractPathFromPublicUrl(row.file_url);
  if (path) {
    await supabase.storage.from(SPEC_SHEET_BUCKET).remove([path]);
  }
}

export async function getSpecSheetById(id: string): Promise<ProductSpecSheet | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_spec_sheets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw { message: "Failed to fetch spec sheet", status: 500 };
  return data as ProductSpecSheet | null;
}