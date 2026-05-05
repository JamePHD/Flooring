import { createSessionHandler } from "../../../controllers/qualifyingSessionController";

export async function POST(req: Request) {
  return createSessionHandler(req);
}