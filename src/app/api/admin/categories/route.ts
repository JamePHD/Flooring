import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  createCategoryHandler,
  listCategoriesAdminHandler,
} from "@/src/controllers/categoryController";

export const GET = withAdminAuth(async (_req: NextRequest, _admin) => {
  return listCategoriesAdminHandler();
});

export const POST = withAdminAuth(async (req: NextRequest, _admin) => {
  return createCategoryHandler(req as unknown as Request);
});
