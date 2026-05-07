import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countProductsForCategory,
  createCategory,
  deleteCategory,
  getCategoryById,
  listActiveCategories,
  listAllCategories,
  reorderCategories,
  updateCategory,
} from "../models/categoryModel";

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
  meta_title: z.string().trim().max(70).optional(),
  meta_description: z.string().trim().max(200).optional(),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    image_url: z.string().trim().max(2000).nullable().optional(),
    sort_order: z.number().int().min(0).max(10000).optional(),
    is_active: z.boolean().optional(),
    meta_title: z.string().trim().max(70).nullable().optional(),
    meta_description: z.string().trim().max(200).nullable().optional(),
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

// GET /api/categories
export async function listCategoriesPublicHandler() {
  try {
    const categories = await listActiveCategories();
    return NextResponse.json({ categories, count: categories.length });
  } catch (err) {
    return handleError(err);
  }
}

// ─── Admin Handlers ──────────────────────────────────────────

// GET /api/admin/categories
export async function listCategoriesAdminHandler() {
  try {
    const categories = await listAllCategories();
    return NextResponse.json({ categories, count: categories.length });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/admin/categories
export async function createCategoryHandler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const created = await createCategory(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/categories/[id]
export async function updateCategoryHandler(req: Request, id: string) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const updated = await updateCategory(id, parsed.data);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/categories/[id]?force=true
// AC#3: blocks delete if products are attached unless force=true.
// With force, products' category_id becomes NULL via the existing
// ON DELETE SET NULL FK behaviour from scrum45-product-schema.sql.
export async function deleteCategoryHandler(req: Request, id: string) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const productCount = await countProductsForCategory(id);
    if (productCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${productCount} attached product${productCount === 1 ? "" : "s"}. Pass ?force=true to delete anyway (products will lose their category).`,
          details: { product_count: productCount },
        },
        { status: 400 }
      );
    }

    await deleteCategory(id);
    return NextResponse.json({ success: true, force_used: force, product_count: productCount });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/categories/reorder
export async function reorderCategoriesHandler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reorder payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await reorderCategories(parsed.data);
    return NextResponse.json({ success: true, updated: parsed.data.length });
  } catch (err) {
    return handleError(err);
  }
}
