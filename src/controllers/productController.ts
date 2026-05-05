import {
  getActiveProducts,
  getProductBySlug,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getFilteredProducts,
  getAvailableBrands,
  getPriceRange,
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from "../models/product.model";

// ─── Public ──────────────────────────────────────────────────

export async function handleGetPublicProducts(filters?: {
  category_slug?: string;
  brand?: string;
  search?: string;
}) {
  return await getActiveProducts(filters);
}

export async function handleGetProductBySlug(slug: string) {
  if (!slug) throw { message: "Slug is required", status: 400 };
  const product = await getProductBySlug(slug);
  if (!product) throw { message: "Product not found", status: 404 };
  return product;
}

// ─── Admin: Products ─────────────────────────────────────────

export async function handleGetAllProducts() {
  return await getAllProducts();
}

export async function handleCreateProduct(input: CreateProductInput) {
  if (!input.name || !input.slug) {
    throw { message: "Name and slug are required", status: 400 };
  }
  return await createProduct(input);
}

export async function handleUpdateProduct(id: string, input: UpdateProductInput) {
  const existing = await getProductById(id);
  if (!existing) throw { message: "Product not found", status: 404 };
  return await updateProduct(id, input);
}

export async function handleDeleteProduct(id: string) {
  const existing = await getProductById(id);
  if (!existing) throw { message: "Product not found", status: 404 };
  await deleteProduct(id);
}

// ─── Admin: Variants ─────────────────────────────────────────

export async function handleCreateVariant(productId: string, input: Omit<CreateVariantInput, "product_id">) {
  const product = await getProductById(productId);
  if (!product) throw { message: "Product not found", status: 404 };
  if (!input.sku) throw { message: "SKU is required", status: 400 };
  return await createVariant({ ...input, product_id: productId });
}

export async function handleUpdateVariant(variantId: string, input: UpdateVariantInput) {
  if (!variantId) throw { message: "Variant ID is required", status: 400 };
  return await updateVariant(variantId, input);
}

export async function handleDeleteVariant(variantId: string) {
  if (!variantId) throw { message: "Variant ID is required", status: 400 };
  await deleteVariant(variantId);
}

// ... keep all existing functions ...

// ─── Comparison Engine Filtering ─────────────────────────────

export async function handleFilterProducts(filters: {
  category_slugs?: string[];
  brands?: string[];
  search?: string;
  min_price?: number;
  max_price?: number;
  attributes?: { attribute_id: string; value: string }[];
  sort_by?: "name" | "price_low" | "price_high";
  page?: number;
  per_page?: number;
}) {
  return await getFilteredProducts(filters);
}

export async function handleGetFilterOptions() {
  const [brands, priceRange] = await Promise.all([
    getAvailableBrands(),
    getPriceRange(),
  ]);

  return { brands, priceRange };
}