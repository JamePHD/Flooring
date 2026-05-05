import { NextResponse } from "next/server";
import { withAdminAuth } from "../../../../../middleware/withAdminAuth";
import { handleReorderCategories } from "../../../../../controllers/categoryController";

export const PATCH = withAdminAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const result = await handleReorderCategories(body);
    return NextResponse.json(result);
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.status || 500 }
    );
  }
});