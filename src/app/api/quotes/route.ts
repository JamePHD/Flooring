import { createQuoteHandler } from "../../../controllers/quote.controller";

export async function POST(req: Request) {
  return createQuoteHandler(req);
}