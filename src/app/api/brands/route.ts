import { listBrandsPublicHandler } from "@/src/controllers/brandController";

export async function GET() {
  return listBrandsPublicHandler();
}
