import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface ReorderItem {
  id: string;
  sort_order: number;
}

// ─── Public Queries ──────────────────────────────────────────

export async function listActiveBrands(): Promise<Brand[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw { message: "Failed to list brands", status: 500 };
  return data as Brand[];
}

// ─── Admin Queries ───────────────────────────────────────────

export async function listAllBrands(): Promise<Brand[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw { message: "Failed to list brands", status: 500 };
  return data as Brand[];
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch brand", status: 500 };
  return data as Brand | null;
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert(input)
    .select()
    .single();
  if (error) {
    // AC#5: duplicate slug returns 400 (UNIQUE constraint violation)
    const isUnique = (error as any).code === "23505";
    throw {
      message: isUnique
        ? "A brand with that slug already exists"
        : error.message || "Failed to create brand",
      status: isUnique ? 400 : 400,
    };
  }
  return data as Brand;
}

export async function updateBrand(
  id: string,
  input: UpdateBrandInput
): Promise<Brand> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error)
    throw { message: error.message || "Failed to update brand", status: 400 };
  return data as Brand;
}

// AC#9: brand-product link is loose (text match by `products.brand` name).
// countProductsForBrand returns the live product count for that name.
export async function countProductsForBrand(name: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("brand", name);
  if (error)
    throw { message: "Failed to count products for brand", status: 500 };
  return (data?.length ?? 0) as number;
}

export async function deleteBrand(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error)
    throw { message: error.message || "Failed to delete brand", status: 400 };
}

export async function reorderBrands(items: ReorderItem[]): Promise<void> {
  const supabase = createAdminClient();
  await Promise.all(
    items.map((item) =>
      supabase
        .from("brands")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id)
    )
  );
}
