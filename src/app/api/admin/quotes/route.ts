import { withAdminAuth } from "../../../../middleware/withAdminAuth";
import { listQuotesHandler } from "../../../../controllers/quote.controller";

export const GET = withAdminAuth(async (req: Request) => {
  return listQuotesHandler(req);
});