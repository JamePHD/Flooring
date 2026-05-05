import { withAdminAuth } from "../../../../../middleware/withAdminAuth";
import {
  getBookingHandler,
  updateBookingHandler,
  deleteBookingHandler,
} from "../../../../../controllers/consultationBookingController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAdminAuth(async (_req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return getBookingHandler(id);
});

export const PATCH = withAdminAuth(async (req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return updateBookingHandler(req, id);
});

export const DELETE = withAdminAuth(async (_req: Request, context: RouteContext) => {
  const { id } = await context.params;
  return deleteBookingHandler(id);
});