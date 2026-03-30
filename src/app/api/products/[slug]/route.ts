import { NextRequest, NextResponse } from "next/server";
import { handleGetProductBySlug } from "@/src/controllers/productController";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await handleGetProductBySlug(params.slug);
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Product not found" },
      { status: error.status || 500 }
    );
  }
}