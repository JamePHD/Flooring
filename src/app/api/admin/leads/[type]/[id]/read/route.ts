import { withAdminAuth } from "../../../../../../middleware/withAdminAuth";
import { markLeadReadHandler } from "../../../../../../controllers/lead.controller";

interface RouteContext {
  params: Promise<{ type: string; id: string }>;
}

export const PATCH = withAdminAuth(async (_req: Request, context: RouteContext) => {
  const { type, id } = await context.params;
  return markLeadReadHandler(type, id);
});