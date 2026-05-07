import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { listLeadsHandler } from "@/src/controllers/lead.controller";

export const GET = withAdminAuth(async (req: NextRequest, _admin) => {
  return listLeadsHandler(req as unknown as Request);
});
