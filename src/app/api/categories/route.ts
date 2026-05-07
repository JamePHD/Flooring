import { listCategoriesPublicHandler } from "@/src/controllers/categoryController";

export async function GET() {
  return listCategoriesPublicHandler();
}
