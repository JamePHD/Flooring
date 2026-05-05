import {
  getSessionHandler,
  updateAnswersHandler,
} from "../../../../controllers/qualifyingSessionController";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { token } = await context.params;
  return getSessionHandler(token);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { token } = await context.params;
  return updateAnswersHandler(req, token);
}