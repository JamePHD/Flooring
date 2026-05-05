import {
  getSessionHandler,
  updateAnswersHandler,
} from "../../../../controllers/qualifyingSessionController";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return getSessionHandler(token);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return updateAnswersHandler(req, token);
}
