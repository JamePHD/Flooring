import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { listBookingsHandler } from "@/src/controllers/consultationBookingController";

export const GET = withAdminAuth(async (req: NextRequest, _admin) => {
  return listBookingsHandler(req);
});