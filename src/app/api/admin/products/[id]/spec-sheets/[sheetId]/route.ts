import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  deleteSheetHandler,
  updateSheetHandler,
} from "@/src/controllers/productSpecSheetController";

export const DELETE = withAdminAuth<{ id: string; sheetId: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id, sheetId } = await params;
    return deleteSheetHandler(id, sheetId);
  }
);

export const PATCH = withAdminAuth<{ id: string; sheetId: string }>(
  async (req: NextRequest, _admin, { params }) => {
    const { id, sheetId } = await params;
    return updateSheetHandler(req as unknown as Request, id, sheetId);
  }
);
