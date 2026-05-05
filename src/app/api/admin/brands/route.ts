import { NextResponse } from "next/server";
import { withAdminAuth } from "../../../../middleware/withAdminAuth";
import {
  handleGetAllBrands,
  handleCreateBrand,
} from "../../../../controllers/brandController";

export const GET = withAdminAuth(async () => {
  try {
    const brands = await handleGetAllBrands();
    return NextResponse.json({ brands });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.status || 500 }
    );
  }
});

export const POST = withAdminAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const brand = await handleCreateBrand(body);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.status || 500 }
    );
  }
});