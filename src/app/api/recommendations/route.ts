import { getRecommendationsHandler } from "../../../controllers/recommendationController";

export async function GET(req: Request) {
  return getRecommendationsHandler(req);
}