import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface ReorderItem {
  id: string;
  sort_order: number;
}

// ─── Public Queries ──────────────────────────────────────────

export async function listActiveCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw { message: "Failed to list categories", status: 500 };
  return data as Category[];
}

// ─── Admin Queries ───────────────────────────────────────────

export async function listAllCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw { message: "Failed to list categories", status: 500 };
  return data as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch category", status: 500 };
  return data as Category | null;
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select()
    .single();
  if (error)
    throw { message: error.message || "Failed to create category", status: 400 };
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<Category> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error)
    throw { message: error.message || "Failed to update category", status: 400 };
  return data as Category;
}

// AC#3: count products attached to a category for delete-blocking
export async function countProductsForCategory(
  categoryId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", categoryId);
  if (error)
    throw { message: "Failed to count products for category", status: 500 };
  return (data?.length ?? 0) as number;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error)
    throw { message: error.message || "Failed to delete category", status: 400 };
}

// AC#4: bulk-update sort_order for the supplied ids.
// Each row gets an individual UPDATE — Supabase doesn't support bulk-update
// with per-row values cleanly. The list is small (a handful of categories)
// so N round trips is fine.
export async function reorderCategories(items: ReorderItem[]): Promise<void> {
  const supabase = createAdminClient();
  await Promise.all(
    items.map((item) =>
      supabase
        .from("categories")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id)
    )
  );
}
