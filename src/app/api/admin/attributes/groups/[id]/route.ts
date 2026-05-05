import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { handleUpdateGroup, handleDeleteGroup } from "@/src/controllers/attributeController";

export const PUT = withAdminAuth(async (req, admin) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  try {
    const body = await req.json();
    const group = await handleUpdateGroup(id, body);
    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update group" },
      { status: error.status || 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (req, admin) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;
  try {
    await handleDeleteGroup(id);
    return NextResponse.json({ message: "Group deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete group" },
      { status: error.status || 500 }
    );
  }
});