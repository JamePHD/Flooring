import { getArticlePublicHandler } from "@/src/controllers/articleController";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return getArticlePublicHandler(slug);
}
