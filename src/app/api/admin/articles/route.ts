import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  createArticleHandler,
  listArticlesAdminHandler,
} from "@/src/controllers/articleController";

export const GET = withAdminAuth(async (req: NextRequest, _admin) => {
  return listArticlesAdminHandler(req as unknown as Request);
});

export const POST = withAdminAuth(async (req: NextRequest, admin) => {
  return createArticleHandler(req as unknown as Request, admin.id);
});
