import { listArticlesPublicHandler } from "@/src/controllers/articleController";

export async function GET(req: Request) {
  return listArticlesPublicHandler(req);
}
