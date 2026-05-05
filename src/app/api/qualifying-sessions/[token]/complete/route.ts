import { markCompleteHandler } from "../../../../../controllers/qualifyingSessionController";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return markCompleteHandler(token);
}
