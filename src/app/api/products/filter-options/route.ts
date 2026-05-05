import { NextResponse } from "next/server";
import { handleGetFilterOptions } from "@/src/controllers/productController";

export async function GET() {
  try {
    const options = await handleGetFilterOptions();
    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch filter options" },
      { status: error.status || 500 }
    );
  }
}