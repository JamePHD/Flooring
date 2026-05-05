import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  getBookingHandler,
  updateBookingHandler,
  deleteBookingHandler,
} from "@/src/controllers/consultationBookingController";

// Helper to extract [id] from the URL path (matches existing pattern)
function getIdFromPath(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.length - 1];
}

export const GET = withAdminAuth(async (req: NextRequest, _admin) => {
  const id = getIdFromPath(req);
  return getBookingHandler(id);
});

export const PATCH = withAdminAuth(async (req: NextRequest, _admin) => {
  const id = getIdFromPath(req);
  return updateBookingHandler(req as unknown as Request, id);
});

export const DELETE = withAdminAuth(async (req: NextRequest, _admin) => {
  const id = getIdFromPath(req);
  return deleteBookingHandler(id);
});