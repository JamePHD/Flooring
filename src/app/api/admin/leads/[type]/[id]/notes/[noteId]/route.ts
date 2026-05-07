import { NextRequest } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { deleteLeadNoteHandler } from "@/src/controllers/lead.controller";

export const DELETE = withAdminAuth<{
  type: string;
  id: string;
  noteId: string;
}>(async (_req: NextRequest, _admin, { params }) => {
  const { type, id, noteId } = await params;
  return deleteLeadNoteHandler(type, id, noteId);
});
