import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { reorderCategoriesHandler } from "@/src/controllers/categoryController";

export const PATCH = withAdminAuth(async (req: NextRequest, _admin) => {
  return reorderCategoriesHandler(req as unknown as Request);
});
