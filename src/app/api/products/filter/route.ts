import { NextRequest, NextResponse } from "next/server";
import { handleFilterProducts } from "@/src/controllers/productController";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const filters = {
      category_slugs: body.category_slugs || undefined,
      brands: body.brands || undefined,
      search: body.search || undefined,
      min_price: body.min_price !== undefined ? Number(body.min_price) : undefined,
      max_price: body.max_price !== undefined ? Number(body.max_price) : undefined,
      attributes: body.attributes || undefined,
      sort_by: body.sort_by || undefined,
      page: body.page ? Number(body.page) : 1,
      per_page: body.per_page ? Number(body.per_page) : 20,
    };

    const result = await handleFilterProducts(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to filter products" },
      { status: error.status || 500 }
    );
  }
}