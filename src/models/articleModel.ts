import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export type ArticleCategory =
  | "installation_guide"
  | "buying_guide"
  | "trends"
  | "product_comparison";

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: ArticleCategory;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: ArticleStatus;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleWithLinks extends Article {
  related_product_ids: string[];
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  body: string;
  category: ArticleCategory;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  status?: ArticleStatus;
  author_id?: string;
  related_product_ids?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  body?: string;
  category?: ArticleCategory;
  featured_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: ArticleStatus;
  related_product_ids?: string[];
}

export interface ListArticlesOptions {
  category?: ArticleCategory;
  status?: ArticleStatus;
  search?: string; // SCRUM-91 — ILIKE on title + body
  limit?: number;
  offset?: number;
}

// ─── Helpers ─────────────────────────────────────────────────

async function attachLinks(
  articles: Article[]
): Promise<ArticleWithLinks[]> {
  if (articles.length === 0) return [];
  const supabase = createAdminClient();
  const ids = articles.map((a) => a.id);
  const { data, error } = await supabase
    .from("article_product_links")
    .select("article_id, product_id, sort_order")
    .in("article_id", ids)
    .order("sort_order", { ascending: true });
  if (error)
    throw { message: "Failed to load article product links", status: 500 };

  const byArticle = new Map<string, string[]>();
  for (const row of data as { article_id: string; product_id: string }[]) {
    const arr = byArticle.get(row.article_id) ?? [];
    arr.push(row.product_id);
    byArticle.set(row.article_id, arr);
  }
  return articles.map((a) => ({
    ...a,
    related_product_ids: byArticle.get(a.id) ?? [],
  }));
}

async function replaceProductLinks(
  articleId: string,
  productIds: string[]
): Promise<void> {
  const supabase = createAdminClient();
  // Wipe existing links for this article
  const { error: delErr } = await supabase
    .from("article_product_links")
    .delete()
    .eq("article_id", articleId);
  if (delErr)
    throw { message: "Failed to clear article links", status: 500 };

  if (productIds.length === 0) return;

  // De-dup, then insert with sort_order matching position
  const seen = new Set<string>();
  const rows = productIds
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((product_id, index) => ({
      article_id: articleId,
      product_id,
      sort_order: index,
    }));

  const { error: insErr } = await supabase
    .from("article_product_links")
    .insert(rows);
  if (insErr) {
    // Most common cause is product_id not existing — surface as 400
    throw {
      message: insErr.message || "Failed to insert article links",
      status: 400,
    };
  }
}

// ─── Public Queries ──────────────────────────────────────────

// SCRUM-72 AC#4 backend: list published articles for the knowledge hub.
// SCRUM-91 AC#2: optional ?search= does case-insensitive substring match
// across title + body. Body still contains HTML tags so a search for
// "vinyl" will match content inside <p>vinyl</p> — fine for MVP.
// Future improvement: Postgres full-text search with tsvector.
export async function listPublishedArticles(
  options: ListArticlesOptions = {}
): Promise<ArticleWithLinks[]> {
  const supabase = createAdminClient();
  const { category, search, limit = 50, offset = 0 } = options;
  let q = supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (category) q = q.eq("category", category);
  if (search && search.trim()) {
    // Strip PostgREST .or() separator chars from user input
    const safe = search.trim().replace(/[%,]/g, (m) => "\\" + m);
    q = q.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
  }
  const { data, error } = await q;
  if (error) throw { message: "Failed to list articles", status: 500 };
  return attachLinks(data as Article[]);
}

export async function getPublishedArticleBySlug(
  slug: string
): Promise<ArticleWithLinks | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw { message: "Failed to fetch article", status: 500 };
  if (!data) return null;
  const [withLinks] = await attachLinks([data as Article]);
  return withLinks;
}

// AC#5: articles linked to a given product. Public — only published articles.
export async function listArticlesByProduct(
  productId: string
): Promise<ArticleWithLinks[]> {
  const supabase = createAdminClient();
  const { data: linkRows, error: linkErr } = await supabase
    .from("article_product_links")
    .select("article_id")
    .eq("product_id", productId);
  if (linkErr)
    throw { message: "Failed to look up article links", status: 500 };
  const ids = (linkRows ?? []).map((r: { article_id: string }) => r.article_id);
  if (ids.length === 0) return [];

  const { data: articles, error: artErr } = await supabase
    .from("articles")
    .select("*")
    .in("id", ids)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (artErr)
    throw { message: "Failed to load linked articles", status: 500 };
  return attachLinks(articles as Article[]);
}

// ─── Admin Queries ───────────────────────────────────────────

export async function listAllArticles(
  options: ListArticlesOptions = {}
): Promise<ArticleWithLinks[]> {
  const supabase = createAdminClient();
  const { category, status, search, limit = 100, offset = 0 } = options;
  let q = supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (category) q = q.eq("category", category);
  if (status) q = q.eq("status", status);
  if (search && search.trim()) {
    const safe = search.trim().replace(/[%,]/g, (m) => "\\" + m);
    q = q.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
  }
  const { data, error } = await q;
  if (error) throw { message: "Failed to list articles", status: 500 };
  return attachLinks(data as Article[]);
}

export async function getArticleById(
  id: string
): Promise<ArticleWithLinks | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch article", status: 500 };
  if (!data) return null;
  const [withLinks] = await attachLinks([data as Article]);
  return withLinks;
}

// AC#1 + AC#2: create article. status defaults to 'draft'; if input.status is
// 'published', published_at is set to now().
export async function createArticle(
  input: CreateArticleInput
): Promise<ArticleWithLinks> {
  const supabase = createAdminClient();
  const { related_product_ids, ...articleFields } = input;
  const insertRow: any = { ...articleFields };
  if (input.status === "published") insertRow.published_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("articles")
    .insert(insertRow)
    .select()
    .single();
  if (error)
    throw { message: error.message || "Failed to create article", status: 400 };

  const created = data as Article;
  if (related_product_ids && related_product_ids.length > 0) {
    await replaceProductLinks(created.id, related_product_ids);
  }
  const [withLinks] = await attachLinks([created]);
  return withLinks;
}

// AC#3: update existing article. Setting status flips published_at.
// Setting related_product_ids replaces the link set entirely.
export async function updateArticle(
  id: string,
  input: UpdateArticleInput,
  current: Article
): Promise<ArticleWithLinks> {
  const supabase = createAdminClient();
  const { related_product_ids, ...articleFields } = input;
  const updateRow: any = { ...articleFields };

  // Status transitions
  if (input.status === "published" && current.status !== "published") {
    // Going draft → published. Stamp published_at if not already set.
    updateRow.published_at = current.published_at ?? new Date().toISOString();
  }
  // Going published → draft (unpublish): we keep published_at as historical
  // so the frontend can show "originally published on X" if it wants.

  if (Object.keys(updateRow).length > 0) {
    const { error } = await supabase
      .from("articles")
      .update(updateRow)
      .eq("id", id);
    if (error)
      throw { message: error.message || "Failed to update article", status: 400 };
  }

  if (related_product_ids !== undefined) {
    await replaceProductLinks(id, related_product_ids);
  }

  const updated = await getArticleById(id);
  if (!updated) throw { message: "Article disappeared after update", status: 500 };
  return updated;
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error)
    throw { message: error.message || "Failed to delete article", status: 400 };
}
