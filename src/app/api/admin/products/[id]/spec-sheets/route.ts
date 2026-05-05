import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  listSheetsAdminHandler,
  uploadSheetHandler,
} from "@/src/controllers/productSpecSheetController";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAdminAuth<{ id: string }>(
  async (req: NextRequest, admin, { params }) => {
    const { id } = await params;
    return uploadSheetHandler(req as unknown as Request, id, admin.id);
  }
);

export const GET = withAdminAuth<{ id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { id } = await params;
    return listSheetsAdminHandler(id);
  }
);
