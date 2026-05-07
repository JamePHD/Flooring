import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  getBookingHandler,
  updateBookingHandler,
  deleteBookingHandler,
} from "@/src/controllers/consultationBookingController";

export const GET = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return getBookingHandler(id);
  }
);

export const PATCH = withAdminAuth<{ id: string }>(
  async (req: NextRequest, admin, { params }) => {
    const { id } = await params;
    return updateBookingHandler(req as unknown as Request, id, admin.id);
  }
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return deleteBookingHandler(id);
  }
);
