import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  handleGetAllCategories,
  handleCreateCategory,
} from "@/src/controllers/categoryController";

// GET all categories (including inactive)
export const GET = withAdminAuth(async (req, admin) => {
  try {
    const categories = await handleGetAllCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: error.status || 500 }
    );
  }
});

// CREATE a new category
export const POST = withAdminAuth(async (req, admin) => {
  try {
    const body = await req.json();
    const category = await handleCreateCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: error.status || 500 }
    );
  }
});