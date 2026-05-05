import { createQuoteHandler } from "@/src/controllers/quote.controller";

export async function POST(req: Request) {
  return createQuoteHandler(req);
}
