import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  deleteQuoteHandler,
  getQuoteHandler,
  updateQuoteHandler,
} from "@/src/controllers/quote.controller";

export const GET = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return getQuoteHandler(id);
  }
);

export const PATCH = withAdminAuth<{ id: string }>(
  async (req: NextRequest, admin, { params }) => {
    const { id } = await params;
    return updateQuoteHandler(req as unknown as Request, id, admin.id);
  }
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return deleteQuoteHandler(id);
  }
);
