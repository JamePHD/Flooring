import { NextResponse } from "next/server";
import { handleGetPublicBrands } from "../../../controllers/brandController";

export async function GET() {
  try {
    const brands = await handleGetPublicBrands();
    return NextResponse.json({ brands });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.status || 500 }
    );
  }
}