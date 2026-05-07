import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { reorderBrandsHandler } from "@/src/controllers/brandController";

export const PATCH = withAdminAuth(async (req: NextRequest, _admin) => {
  return reorderBrandsHandler(req as unknown as Request);
});
