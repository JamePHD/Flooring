import { NextRequest, NextResponse } from "next/server";
import { handleGetPublicProducts } from "@/src/controllers/productController";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      category_slug: searchParams.get("category") || undefined,
      brand: searchParams.get("brand") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const products = await handleGetPublicProducts(filters);
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: error.status || 500 }
    );
  }
}