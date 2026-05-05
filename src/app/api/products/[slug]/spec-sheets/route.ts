import { NextResponse } from "next/server";
import {
  getProductIdBySlug,
} from "@/src/models/productSpecSheetModel";
import { listSheetsPublicHandler } from "@/src/controllers/productSpecSheetController";

// AC#5 — public GET. The route is mounted under /products/[slug] (matches the
// existing convention in this codebase), so we resolve slug → id before
// delegating to the controller, which works in terms of product ids.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const productId = await getProductIdBySlug(slug);
  if (!productId) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return listSheetsPublicHandler(productId);
}
