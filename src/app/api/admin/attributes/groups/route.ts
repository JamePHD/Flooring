import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { handleCreateGroup } from "@/src/controllers/attributeController";

export const POST = withAdminAuth(async (req, admin) => {
  try {
    const body = await req.json();
    const group = await handleCreateGroup(body);
    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create group" },
      { status: error.status || 500 }
    );
  }
});