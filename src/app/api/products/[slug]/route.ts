import { NextRequest, NextResponse } from "next/server";
import { handleGetProductBySlug } from "@/src/controllers/productController";

// Next.js 16: params is a Promise that must be awaited.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await handleGetProductBySlug(slug);
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Product not found" },
      { status: error.status || 500 }
    );
  }
}