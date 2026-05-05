import {
  getActiveBrands,
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  countProductsForBrand,
  reorderBrands,
  CreateBrandInput,
  UpdateBrandInput,
} from "../models/brandModel";

export async function handleGetPublicBrands() {
  return await getActiveBrands();
}

export async function handleGetAllBrands() {
  return await getAllBrands();
}

export async function handleCreateBrand(input: CreateBrandInput) {
  if (!input.name || !input.slug) {
    throw { message: "Name and slug are required", status: 400 };
  }
  return await createBrand(input);
}

export async function handleUpdateBrand(id: string, input: UpdateBrandInput) {
  const existing = await getBrandById(id);
  if (!existing) {
    throw { message: "Brand not found", status: 404 };
  }
  return await updateBrand(id, input);
}

// Same block-with-force pattern as categories
export async function handleDeleteBrand(id: string, force = false) {
  const existing = await getBrandById(id);
  if (!existing) {
    throw { message: "Brand not found", status: 404 };
  }

  const productCount = await countProductsForBrand(existing.name);
  if (productCount > 0 && !force) {
    throw {
      message: `Cannot delete brand: ${productCount} product${
        productCount === 1 ? "" : "s"
      } still reference this brand. Reassign them first or use ?force=true to delete anyway.`,
      status: 400,
      details: { product_count: productCount },
    };
  }

  await deleteBrand(id);
}

export async function handleReorderBrands(
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
  await reorderBrands(input);
  return { success: true, count: input.length };
}