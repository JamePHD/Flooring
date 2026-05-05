import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { listQuotesHandler } from "@/src/controllers/quote.controller";

export const GET = withAdminAuth(async (req: NextRequest, _admin) => {
  return listQuotesHandler(req as unknown as Request);
});
