import { createAdminClient } from "../lib/supabase/admin";
import { createServerClient } from "../lib/supabase/server";

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
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Public: only active brands
export async function getActiveBrands(): Promise<Brand[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw { message: "Failed to fetch brands", status: 500 };
  return data as Brand[];
}

// Admin: all brands including inactive
export async function getAllBrands(): Promise<Brand[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw { message: "Failed to fetch brands", status: 500 };
  return data as Brand[];
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Brand;
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create brand", status: 400 };
  return data as Brand;
}

export async function updateBrand(id: string, input: UpdateBrandInput): Promise<Brand> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update brand", status: 400 };
  return data as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", id);

  if (error) throw { message: error.message || "Failed to delete brand", status: 400 };
}

// Count products with this brand name (loose link via products.brand text match)
export async function countProductsForBrand(brandName: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand", brandName);

  if (error) throw { message: "Failed to count products for brand", status: 500 };
  return count ?? 0;
}

// Bulk reorder
export async function reorderBrands(
  ordered: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = createAdminClient();
  for (const { id, sort_order } of ordered) {
    const { error } = await supabase
      .from("brands")
      .update({ sort_order })
      .eq("id", id);
    if (error) throw { message: `Failed to reorder brand ${id}`, status: 500 };
  }
}