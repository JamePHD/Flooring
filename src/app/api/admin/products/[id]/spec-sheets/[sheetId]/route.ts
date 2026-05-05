import { withAdminAuth } from "../../../../../../../middleware/withAdminAuth";
import {
  updateSpecSheetHandler,
  deleteSpecSheetHandler,
} from "../../../../../../../controllers/productSpecSheetController";

interface RouteContext {
  params: Promise<{ id: string; sheetId: string }>;
}

export const PATCH = withAdminAuth(async (req: Request, context: RouteContext) => {
  const { id, sheetId } = await context.params;
  return updateSpecSheetHandler(req, id, sheetId);
});

export const DELETE = withAdminAuth(async (_req: Request, context: RouteContext) => {
  const { id, sheetId } = await context.params;
  return deleteSpecSheetHandler(id, sheetId);
});