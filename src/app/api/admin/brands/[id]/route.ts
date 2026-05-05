import { NextResponse } from "next/server";
import { withAdminAuth } from "../../../../../middleware/withAdminAuth";
import {
  handleUpdateBrand,
  handleDeleteBrand,
} from "../../../../../controllers/brandController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withAdminAuth(async (req: Request, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const brand = await handleUpdateBrand(id, body);
    return NextResponse.json({ brand });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: e.status || 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (req: Request, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    await handleDeleteBrand(id, force);
    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as { message?: string; status?: number; details?: unknown };
    return NextResponse.json(
      { error: e.message, ...(e.details ? { details: e.details } : {}) },
      { status: e.status || 500 }
    );
  }
});