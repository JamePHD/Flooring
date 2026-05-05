import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/authMiddleware";
import {
  handleUpdateProduct,
  handleDeleteProduct,
} from "@/controllers/productController";

export const PUT = withAdminAuth(async (req, admin) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  try {
    const body = await req.json();
    const product = await handleUpdateProduct(id, body);
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: error.status || 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (req, admin) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  try {
    await handleDeleteProduct(id);
    return NextResponse.json({ message: "Product deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: error.status || 500 }
    );
  }
});