import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/authMiddleware";
import {
  handleGetAllProducts,
  handleCreateProduct,
} from "@/controllers/productController";

export const GET = withAdminAuth(async (req, admin) => {
  try {
    const products = await handleGetAllProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: error.status || 500 }
    );
  }
});

export const POST = withAdminAuth(async (req, admin) => {
  try {
    const body = await req.json();
    const product = await handleCreateProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: error.status || 500 }
    );
  }
});