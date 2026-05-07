import { createAdminClient } from "../lib/supabase/admin";

// Re-export Category from the canonical location (categoryModel) so any
// older importers don't break.
export type { Category } from "./categoryModel";

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
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Queries ─────────────────────────────────────────────────

// Public lookup by slug. Only returns active products. select("*") so the
// SCRUM-51 meta_title / meta_description columns flow through automatically.
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch product", status: 500 };
  return data as Product | null;
}
