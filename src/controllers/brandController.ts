import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countProductsForBrand,
  createBrand,
  deleteBrand,
  getBrandById,
  listActiveBrands,
  listAllBrands,
  reorderBrands,
  updateBrand,
} from "../models/brandModel";

// ─── Validation ──────────────────────────────────────────────

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase, hyphens)");

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  image_url: z.string().trim().max(2000).optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  is_active: z.boolean().optional(),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    image_url: z.string().trim().max(2000).nullable().optional(),
    sort_order: z.number().int().min(0).max(10000).optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (d) => Object.keys(d).length > 0,
    { message: "At least one field must be provided" }
  );

const reorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0).max(10000),
    })
  )
  .min(1, "Reorder array must contain at least one item");

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

// ─── Public Handlers ─────────────────────────────────────────

export async function listBrandsPublicHandler() {
  try {
    const brands = await listActiveBrands();
    return NextResponse.json({ brands, count: brands.length });
  } catch (err) {
    return handleError(err);
  }
}

// ─── Admin Handlers ──────────────────────────────────────────

export async function listBrandsAdminHandler() {
  try {
    const brands = await listAllBrands();
    return NextResponse.json({ brands, count: brands.length });
  } catch (err) {
    return handleError(err);
  }
}

export async function createBrandHandler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const created = await createBrand(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateBrandHandler(req: Request, id: string) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const existing = await getBrandById(id);
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    const updated = await updateBrand(id, parsed.data);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// AC#6: brand-product link is loose (text match by name). Counting checks
// products.brand against the brand's *name* (not id), so renaming the
// brand doesn't update the product count via this lookup either.
// Note: deleting a brand does NOT update products.brand text values.
export async function deleteBrandHandler(req: Request, id: string) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    const existing = await getBrandById(id);
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const productCount = await countProductsForBrand(existing.name);
    if (productCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete brand "${existing.name}" with ${productCount} matching product${productCount === 1 ? "" : "s"}. Pass ?force=true to delete anyway (products keep their brand text — loose link).`,
          details: { product_count: productCount },
        },
        { status: 400 }
      );
    }

    await deleteBrand(id);
    return NextResponse.json({ success: true, force_used: force, product_count: productCount });
  } catch (err) {
    return handleError(err);
  }
}

export async function reorderBrandsHandler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reorder payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await reorderBrands(parsed.data);
    return NextResponse.json({ success: true, updated: parsed.data.length });
  } catch (err) {
    return handleError(err);
  }
}
