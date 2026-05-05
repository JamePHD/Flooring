import { listSpecSheetsHandler } from "../../../../../controllers/productSpecSheetController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  return listSpecSheetsHandler(id);
}