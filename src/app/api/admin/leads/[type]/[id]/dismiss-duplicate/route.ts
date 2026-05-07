import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { dismissDuplicateHandler } from "@/src/controllers/lead.controller";

export const POST = withAdminAuth<{ type: string; id: string }>(
  async (_req: NextRequest, admin, { params }) => {
    const { type, id } = await params;
    return dismissDuplicateHandler(type, id, admin.id);
  }
);
