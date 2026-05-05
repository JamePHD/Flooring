import { markCompleteHandler } from "../../../../../controllers/qualifyingSessionController";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function PATCH(_req: Request, context: RouteContext) {
  const { token } = await context.params;
  return markCompleteHandler(token);
}