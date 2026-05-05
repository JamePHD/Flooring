import { NextResponse } from "next/server";
import { withAdminAuth } from "../../../../../middleware/withAdminAuth";
import { handleReorderBrands } from "../../../../../controllers/brandController";

export const PATCH = withAdminAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const result = await handleReorderBrands(body);
    return NextResponse.json(result);
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.status || 500 }
    );
  }
});