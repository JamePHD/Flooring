import { withAdminAuth } from "../../../../middleware/withAdminAuth";
import { listLeadsHandler } from "../../../../controllers/lead.controller";

export const GET = withAdminAuth(async (req: Request) => {
  return listLeadsHandler(req);
});