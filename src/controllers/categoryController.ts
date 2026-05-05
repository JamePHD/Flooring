import {
  getActiveCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  countProductsInCategory,
  reorderCategories,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../models/categoryModel";

export async function handleGetPublicCategories() {
  return await getActiveCategories();
}

export async function handleGetAllCategories() {
  return await getAllCategories();
}

export async function handleCreateCategory(input: CreateCategoryInput) {
  if (!input.name || !input.slug) {
    throw { message: "Name and slug are required", status: 400 };
  }
  return await createCategory(input);
}

export async function handleUpdateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await getCategoryById(id);
  if (!existing) {
    throw { message: "Category not found", status: 404 };
  }
  return await updateCategory(id, input);
}

// AC#4: Block delete if products exist, unless ?force=true
export async function handleDeleteCategory(id: string, force = false) {
  const existing = await getCategoryById(id);
  if (!existing) {
    throw { message: "Category not found", status: 404 };
  }

  const productCount = await countProductsInCategory(id);
  if (productCount > 0 && !force) {
    throw {
      message: `Cannot delete category: ${productCount} product${
        productCount === 1 ? "" : "s"
      } still reference this category. Reassign them first or use ?force=true to delete anyway.`,
      status: 400,
      details: { product_count: productCount },
    };
  }

  await deleteCategory(id);
}

// AC#5: Reorder categories
export async function handleReorderCategories(
  input: { id: string; sort_order: number }[]
) {
  if (!Array.isArray(input) || input.length === 0) {
    throw { message: "Body must be a non-empty array of { id, sort_order }", status: 400 };
  }
  for (const item of input) {
    if (!item.id || typeof item.sort_order !== "number") {
      throw { message: "Each item must have id (string) and sort_order (number)", status: 400 };
    }
  }
  await reorderCategories(input);
  return { success: true, count: input.length };
}
