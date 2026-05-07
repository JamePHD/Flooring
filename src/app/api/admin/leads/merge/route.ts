import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { mergeLeadsHandler } from "@/src/controllers/lead.controller";

export const POST = withAdminAuth(async (req: NextRequest, admin) => {
  return mergeLeadsHandler(req as unknown as Request, admin.id);
});
