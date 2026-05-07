import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  createBrandHandler,
  listBrandsAdminHandler,
} from "@/src/controllers/brandController";

export const GET = withAdminAuth(async (_req: NextRequest, _admin) => {
  return listBrandsAdminHandler();
});

export const POST = withAdminAuth(async (req: NextRequest, _admin) => {
  return createBrandHandler(req as unknown as Request);
});
