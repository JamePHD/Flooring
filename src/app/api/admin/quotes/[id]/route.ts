import { withAdminAuth } from "../../../../../middleware/withAdminAuth";
import {
  getQuoteHandler,
  updateQuoteHandler,
  deleteQuoteHandler,
} from "../../../../../controllers/quote.controller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAdminAuth(async (_req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return getQuoteHandler(id);
});

export const PATCH = withAdminAuth(async (req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return updateQuoteHandler(req, id);
});

export const DELETE = withAdminAuth(async (_req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return deleteQuoteHandler(id);
});