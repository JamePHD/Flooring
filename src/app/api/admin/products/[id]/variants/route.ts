import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/authMiddleware";
import { handleCreateVariant } from "@/controllers/productController";

export const POST = withAdminAuth(async (req, admin) => {
  const segments = req.nextUrl.pathname.split("/");
  const productId = segments[segments.indexOf("products") + 1];
  try {
    const body = await req.json();
    const variant = await handleCreateVariant(productId, body);
    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create variant" },
      { status: error.status || 500 }
    );
  }
});