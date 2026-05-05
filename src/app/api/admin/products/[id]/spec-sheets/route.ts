import { withAdminAuth } from "../../../../../../middleware/withAdminAuth";
import { createSpecSheetHandler } from "../../../../../../controllers/productSpecSheetController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withAdminAuth(async (req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return createSpecSheetHandler(req, id);
});