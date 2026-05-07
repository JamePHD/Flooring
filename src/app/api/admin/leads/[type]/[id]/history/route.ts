import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { leadHistoryHandler } from "@/src/controllers/lead.controller";

export const GET = withAdminAuth<{ type: string; id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { type, id } = await params;
    return leadHistoryHandler(type, id);
  }
);
