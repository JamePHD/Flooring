import { NextResponse } from "next/server";
import { getProductIdBySlug } from "@/src/models/productSpecSheetModel";
import { listArticlesForProductHandler } from "@/src/controllers/articleController";

// SCRUM-72 + SCRUM-90: list published articles linked to a product.
// Mounted under products/[slug]/ to match the existing public products
// convention (slug → UUID lookup before delegating).
//
// Default limit is 3 (SCRUM-90 AC#3 — "up to three articles"). Callers
// can override via ?limit=N or pass ?limit=0 to opt out of the cap.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const productId = await getProductIdBySlug(slug);
  if (!productId) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  let limit: number | undefined;
  if (limitParam !== null) {
    const n = Number(limitParam);
    if (!Number.isFinite(n) || n < 0 || n > 200) {
      return NextResponse.json(
        { error: "limit must be a number between 0 and 200" },
        { status: 400 }
      );
    }
    // 0 means "no cap" — pass a large number that effectively unlimits
    limit = n === 0 ? 200 : Math.floor(n);
  }

  return listArticlesForProductHandler(productId, limit);
}
