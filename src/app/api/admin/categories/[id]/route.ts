import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  deleteCategoryHandler,
  updateCategoryHandler,
} from "@/src/controllers/categoryController";

export const PATCH = withAdminAuth<{ id: string }>(
  async (req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return updateCategoryHandler(req as unknown as Request, id);
  }
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return deleteCategoryHandler(req as unknown as Request, id);
  }
);
