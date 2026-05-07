import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { publishArticleHandler } from "@/src/controllers/articleController";

export const PATCH = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return publishArticleHandler(id);
  }
);
