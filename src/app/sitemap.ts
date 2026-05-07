import type { MetadataRoute } from "next";
import { listPublishedArticles } from "@/src/models/articleModel";

// AC#5: sitemap must reflect newly-published articles without rebuilding.
// `force-dynamic` opts out of Next's default sitemap caching so each
// request re-queries the DB. Cheap — 1 query per crawl, and crawlers
// hit /sitemap.xml infrequently.
export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

// AC#4 — knowledge hub article slugs come from the DB. The static
// entries below are bonus coverage for crawlers (homepage, hub index,
// product index). Frontend team can edit this list when more pages
// land — it's a one-line addition per page.
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/knowledge-hub", changeFrequency: "daily", priority: 0.9 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Pull every published article. limit=1000 covers comfortable headroom
  // before pagination becomes an issue; if the hub ever grows past that,
  // swap to Next's `generateSitemaps` for chunked sitemap files.
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const articles = await listPublishedArticles({ limit: 1000 });
    articleEntries = articles.map((a) => ({
      url: `${SITE_URL}/knowledge-hub/${a.slug}`,
      // Articles get an updated_at on every PATCH; published_at on flip
      // to published. Use whichever is more recent.
      lastModified: a.updated_at
        ? new Date(a.updated_at)
        : a.published_at
        ? new Date(a.published_at)
        : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch (err) {
    // Don't break the sitemap entirely on DB failure — return static
    // pages and log the issue so it surfaces in monitoring.
    console.error(
      "[sitemap] failed to load articles:",
      err instanceof Error ? err.message : String(err)
    );
  }

  return [...staticEntries, ...articleEntries];
}
