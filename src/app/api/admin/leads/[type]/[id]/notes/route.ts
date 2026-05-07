import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import {
  addLeadNoteHandler,
  listLeadNotesHandler,
} from "@/src/controllers/lead.controller";

export const GET = withAdminAuth<{ type: string; id: string }>(
  async (_req: NextRequest, _admin, { params }) => {
    const { type, id } = await params;
    return listLeadNotesHandler(type, id);
  }
);

export const POST = withAdminAuth<{ type: string; id: string }>(
  async (req: NextRequest, admin, { params }) => {
    const { type, id } = await params;
    return addLeadNoteHandler(req as unknown as Request, type, id, admin.id);
  }
);
