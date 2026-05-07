import { getProductBySlug } from "../models/product.model";

// SCRUM-51 (AC#3): public product endpoint returns all columns including
// meta_title and meta_description via select("*") in the model.
// Categories live in categoryController now (SCRUM-69).

export async function handleGetProductBySlug(slug: string) {
  const product = await getProductBySlug(slug);
  if (!product) throw { message: "Product not found", status: 404 };
  return product;
}
