import { createAdminClient } from "../lib/supabase/admin";
import { createServerClient } from "../lib/supabase/server";

export interface Category {
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

export interface CreateCategoryInput {
    name: string;
    slug: string; 
    description?: string; 
    image_url?: string; 
    sort_order?: number; 
}

export interface UpdateCategoryInput {
    name?: string; 
    slug?: string; 
    description?: string; 
    image_url?: string; 
    sort_order?: number; 
    is_active?: boolean; 
}

// public returns only active categories 
export async function getActiveCategories(): Promise<Category[]> {
    const supabase = createServerClient(); 
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }); 

    if (error) throw { message: "Failed to fetch categories", status: 500 }; 
    return data as Category[]; 
}

// admin returns all categories including inactive 
export async function getAllCategories(): Promise<Category[]> {
    const supabase = createAdminClient(); 
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }); 
    
    if (error) throw { message: "Failed to fetch categories", status: 500 };
    return data as Category[]; 
}

// admin get single catgeory by ID 
export async function getCategoryById(id: string): Promise<Category | null> {
    const supabase = createAdminClient(); 
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single(); 

    if (error || !data) return null; 
    return data as Category; 
}

// admin create 
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
    const supabase = createAdminClient(); 
    const { data, error } = await supabase
        .from("categories")
        .insert(input)
        .select()
        .single(); 
    
    if (error) throw { message: error.message || "Failed to create category", status: 400};
    return data as Category; 
}

//admin update 
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const supabase = createAdminClient(); 
    const { data, error } = await supabase
        .from("categories")
        .update(input)
        .eq("id", id)
        .select()
        .single(); 
    
    if (error) throw { message: error.message || "Failed to update category", status: 400};
    return data as Category; 
}

// admin delete 

export async function deleteCategory(id: string): Promise<void> { 
    const supabase = createAdminClient(); 
    const { error } = await supabase 
        .from("categories")
        .delete()
        .eq("id", id); 

    if (error) throw { message: error.message || "Failed to delete category", status: 400};
}

// Count products in a category (for delete blocking — AC#4)
export async function countProductsInCategory(categoryId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) throw { message: "Failed to count products in category", status: 500 };
  return count ?? 0;
}

// Bulk update sort_order for multiple categories (AC#5 reorder)
export async function reorderCategories(
  ordered: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = createAdminClient();

  // Update each row sequentially. Postgres doesn't have a clean bulk-update
  // for different values per row without raw SQL or unnest tricks; for
  // category counts (small N) this is fine.
  for (const { id, sort_order } of ordered) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order })
      .eq("id", id);

    if (error) {
      throw { message: `Failed to reorder category ${id}`, status: 500 };
    }
  }
}