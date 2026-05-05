import { createBookingHandler } from "../../../controllers/consultationBookingController";

export async function POST(req: Request) {
  return createBookingHandler(req);
}