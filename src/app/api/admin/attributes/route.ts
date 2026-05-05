import { NextResponse } from "next/server";
import { handleGetTieredAttributes } from "@/src/controllers/attributeController";

export async function GET() {
  try {
    const groups = await handleGetTieredAttributes();
    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch attributes" },
      { status: error.status || 500 }
    );
  }
}