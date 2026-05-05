import { withAdminAuth } from "../../../../middleware/withAdminAuth";
import { listBookingsHandler } from "../../../../controllers/consultationBookingController";

export const GET = withAdminAuth(async (req: Request) => {
  return listBookingsHandler(req);
});