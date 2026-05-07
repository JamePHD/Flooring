import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  deleteArticleHandler,
  getArticleAdminHandler,
  updateArticleHandler,
} from "@/src/controllers/articleController";

export const GET = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return getArticleAdminHandler(id);
  }
);

export const PATCH = withAdminAuth<{ id: string }>(
  async (req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return updateArticleHandler(req as unknown as Request, id);
  }
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return deleteArticleHandler(id);
  }
);
