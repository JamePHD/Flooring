import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  deleteBrandHandler,
  updateBrandHandler,
} from "@/src/controllers/brandController";

export const PATCH = withAdminAuth<{ id: string }>(
  async (req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return updateBrandHandler(req as unknown as Request, id);
  }
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return deleteBrandHandler(req as unknown as Request, id);
  }
);
