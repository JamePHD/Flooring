import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  handleUpdateVariant,
  handleDeleteVariant,
} from "@/src/controllers/productController";

export const PUT = withAdminAuth(async (req, admin) => {
  const variantId = req.nextUrl.pathname.split("/").pop() as string;
  try {
    const body = await req.json();
    const variant = await handleUpdateVariant(variantId, body);
    return NextResponse.json(variant);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update variant" },
      { status: error.status || 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (req, admin) => {
  const variantId = req.nextUrl.pathname.split("/").pop() as string;
  try {
    await handleDeleteVariant(variantId);
    return NextResponse.json({ message: "Variant deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete variant" },
      { status: error.status || 500 }
    );
  }
});