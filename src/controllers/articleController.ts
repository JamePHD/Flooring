import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ArticleCategory,
  ArticleWithLinks,
  createArticle,
  deleteArticle,
  getArticleById,
  getPublishedArticleBySlug,
  listAllArticles,
  listArticlesByProduct,
  listPublishedArticles,
  updateArticle,
} from "../models/articleModel";

// SCRUM-90: build a short plain-text excerpt from the rich-text body.
// Strips HTML tags, collapses whitespace, decodes a couple of common entities,
// and truncates at a word boundary near the target length with an ellipsis.
function buildExcerpt(body: string, maxLength = 160): string {
  const text = body
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  // Cut at the last word boundary before maxLength
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + "…";
}

// SCRUM-90 AC#3: card-shaped public article — title, excerpt, link
// (slug for the FE to build the href). Drops `body` to keep list
// responses lean. Used in list endpoints; single-article endpoint still
// returns the full body.
function articleCardView(article: ArticleWithLinks) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: buildExcerpt(article.body),
    category: article.category,
    featured_image_url: article.featured_image_url,
    published_at: article.published_at,
  };
}

// ─── Validation ──────────────────────────────────────────────

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase, hyphens)");

const categorySchema = z.enum([
  "installation_guide",
  "buying_guide",
  "trends",
  "product_comparison",
]);

const statusSchema = z.enum(["draft", "published"]);

const productIdsSchema = z
  .array(z.string().uuid())
  .max(50, "At most 50 related products per article");

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: slugSchema,
  body: z.string().min(1).max(200_000),
  category: categorySchema,
  featured_image_url: z.string().trim().max(2000).optional(),
  meta_title: z.string().trim().max(70).optional(),
  meta_description: z.string().trim().max(200).optional(),
  status: statusSchema.optional(),
  related_product_ids: productIdsSchema.optional(),
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    slug: slugSchema.optional(),
    body: z.string().min(1).max(200_000).optional(),
    category: categorySchema.optional(),
    featured_image_url: z.string().trim().max(2000).nullable().optional(),
    meta_title: z.string().trim().max(70).nullable().optional(),
    meta_description: z.string().trim().max(200).nullable().optional(),
    status: statusSchema.optional(),
    related_product_ids: productIdsSchema.optional(),
  })
  .refine(
    (d) => Object.keys(d).length > 0,
    { message: "At least one field must be provided" }
  );

const listQuerySchema = z.object({
  category: categorySchema.optional(),
  status: statusSchema.optional(),
  search: z.string().trim().min(1).max(200).optional(), // SCRUM-91
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

// ─── Public Handlers ─────────────────────────────────────────

// GET /api/articles[?category=...&search=...]
export async function listArticlesPublicHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const articles = await listPublishedArticles(parsed.data);
    return NextResponse.json({
      articles: articles.map(articleCardView),
      count: articles.length,
    });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/articles/[slug]
// Returns the full article incl. body. Also includes excerpt for convenience
// (handy for OG meta tags in the frontend).
export async function getArticlePublicHandler(slug: string) {
  try {
    const article = await getPublishedArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...article,
      excerpt: buildExcerpt(article.body),
    });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/products/[slug]/articles[?limit=3]
// SCRUM-90: PDP-related-articles endpoint. Default limit of 3 matches AC#3
// ("up to three articles"); callers can override or omit for the full list.
export async function listArticlesForProductHandler(
  productId: string,
  limit?: number
) {
  try {
    const all = await listArticlesByProduct(productId);
    const effectiveLimit = limit && limit > 0 ? limit : 3;
    const sliced = all.slice(0, effectiveLimit);
    return NextResponse.json({
      articles: sliced.map(articleCardView),
      count: sliced.length,
      total: all.length,
    });
  } catch (err) {
    return handleError(err);
  }
}

// ─── Admin Handlers ──────────────────────────────────────────

// GET /api/admin/articles[?status=...&category=...&search=...]
export async function listArticlesAdminHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const articles = await listAllArticles(parsed.data);
    return NextResponse.json({ articles, count: articles.length });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/admin/articles/[id]
export async function getArticleAdminHandler(id: string) {
  try {
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/admin/articles
export async function createArticleHandler(req: Request, adminId: string) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const created = await createArticle({ ...parsed.data, author_id: adminId });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/articles/[id]
export async function updateArticleHandler(req: Request, id: string) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    const updated = await updateArticle(id, parsed.data, existing);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/admin/articles/[id]
export async function deleteArticleHandler(id: string) {
  try {
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    await deleteArticle(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/articles/[id]/publish — convenience shortcut.
// Equivalent to PATCH /[id] with body { status: "published" }.
export async function publishArticleHandler(id: string) {
  try {
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (existing.status === "published") {
      return NextResponse.json(existing);
    }
    const updated = await updateArticle(id, { status: "published" }, existing);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/articles/[id]/unpublish — AC#3 unpublish shortcut.
export async function unpublishArticleHandler(id: string) {
  try {
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (existing.status === "draft") {
      return NextResponse.json(existing);
    }
    const updated = await updateArticle(id, { status: "draft" }, existing);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
