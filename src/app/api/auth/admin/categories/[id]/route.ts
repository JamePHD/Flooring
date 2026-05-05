import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  handleUpdateCategory,
  handleDeleteCategory,
} from "@/src/controllers/categoryController";

// UPDATE a category
export const PUT = withAdminAuth(async (req, admin) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  try {
    const body = await req.json();
    const category = await handleUpdateCategory(id, body);
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: error.status || 500 }
    );
  }
});

// DELETE a category
export const DELETE = withAdminAuth(async (req, admin) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  try {
    await handleDeleteCategory(id);
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: error.status || 500 }
    );
  }
});