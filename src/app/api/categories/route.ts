import { NextResponse } from "next/server";
import { handleGetPublicCategories } from "@/src/controllers/categoryController";

export async function GET() {
  try {
    const categories = await handleGetPublicCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: error.status || 500 }
    );
  }
}