import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { markLeadReadHandler } from "@/src/controllers/lead.controller";

export const PATCH = withAdminAuth<{ type: string; id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { type, id } = await params;
    return markLeadReadHandler(type, id);
  }
);
