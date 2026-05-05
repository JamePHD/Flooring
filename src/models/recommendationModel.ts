import { createServerClient } from "../lib/supabase/server";
import { getSessionByToken } from "./qualifyingSessionModel";

// ─── Types ───────────────────────────────────────────────────

export interface RecommendedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  spec_sheet_url: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: ProductVariantSummary[];
  attributes: Record<string, string>;
}

export interface ProductVariantSummary {
  id: string;
  sku: string;
  colour_name: string | null;
  size_label: string | null;
  price_per_sqm: number | null;
}

export interface RecommendationFilters {
  // DIY Homeowner
  room_type?: string;
  budget_range?: string;
  lifestyle_needs?: string[];
  // Architect/Designer
  performance_attributes?: string[];
  needs_specification_sheets?: boolean;
  // Common (architect + investor share project_type semantics differently)
  project_type?: "residential" | "commercial" | "new_build" | "renovation";
  // Property Investor
  budget_per_sqm?: number;
  durability_rating?: number;
}

export interface RecommendationResult {
  products: RecommendedProduct[];
  total: number;
  filters_applied: string[];
  filters_skipped: string[]; // filters that had no data to match against
}

// ─── Mapping qualifying answers → recommendation filters ─────

const LIFESTYLE_NEED_TO_ATTRIBUTE: Record<string, string> = {
  pets: "pet-friendly",
  kids: "kid-friendly",
  waterproofing: "waterproof",
};

// Maps performance_attributes from architect path to attribute slugs
const PERFORMANCE_ATTR_TO_SLUG: Record<string, string> = {
  scratch_resistant: "scratch-resistant",
  sound_absorbing: "sound-absorbing",
  low_voc: "low-voc",
  waterproof: "waterproof",
};

// ─── Public Queries ──────────────────────────────────────────

/**
 * Build recommendation filters from a qualifying session token.
 * Returns null if the session doesn't exist.
 */
export async function buildFiltersFromSession(
  sessionToken: string
): Promise<RecommendationFilters | null> {
  const session = await getSessionByToken(sessionToken);
  if (!session) return null;

  const answers = session.answers as Record<string, unknown>;
  return answers as RecommendationFilters;
}

/**
 * Fetch products matching the given filters.
 * Strict AND semantics across all criteria.
 * Null/missing data on a product = include (benefit of the doubt) for MVP,
 * EXCEPT for needs_specification_sheets where null = exclude.
 */
export async function getRecommendations(
  filters: RecommendationFilters,
  limit = 20
): Promise<RecommendationResult> {
  const supabase = createServerClient();
  const filtersApplied: string[] = [];
  const filtersSkipped: string[] = [];

  // Step 1: build the products query with column-level filters
  let query = supabase
    .from("products")
    .select(`
      id,
      slug,
      name,
      brand,
      description,
      short_description,
      image_url,
      spec_sheet_url,
      is_residential,
      is_commercial,
      categories ( id, name, slug ),
      product_variants (
        id, sku, colour_name, size_label, price_per_sqm, is_active
      ),
      product_attributes (
        value,
        attributes ( slug )
      )
    `)
    .eq("is_active", true);

  // Architect/Investor: residential vs commercial
  if (filters.project_type === "commercial") {
    query = query.eq("is_commercial", true);
    filtersApplied.push("project_type=commercial");
  } else if (filters.project_type === "residential") {
    query = query.eq("is_residential", true);
    filtersApplied.push("project_type=residential");
  }

  // Architect: spec sheet required
  if (filters.needs_specification_sheets === true) {
    query = query.not("spec_sheet_url", "is", null);
    filtersApplied.push("needs_specification_sheets");
  }

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw { message: "Failed to fetch recommendations", status: 500 };

  // Step 2: in-memory attribute filtering (Supabase can't do nested AND across joins cleanly)
  let products = (data ?? []) as any[];

  // Required attribute matches built up from filters
  const requiredAttributes: Array<{ slug: string; predicate: (val: string) => boolean }> = [];

  // Lifestyle needs → boolean attributes
  if (filters.lifestyle_needs?.length) {
    for (const need of filters.lifestyle_needs) {
      const slug = LIFESTYLE_NEED_TO_ATTRIBUTE[need];
      if (slug) {
        requiredAttributes.push({ slug, predicate: (v) => v === "true" });
        filtersApplied.push(`lifestyle:${need}`);
      }
    }
  }

  // Performance attributes (architect)
  if (filters.performance_attributes?.length) {
    for (const attr of filters.performance_attributes) {
      const slug = PERFORMANCE_ATTR_TO_SLUG[attr];
      if (slug) {
        requiredAttributes.push({ slug, predicate: (v) => v === "true" });
        filtersApplied.push(`performance:${attr}`);
      }
    }
  }

  // Durability rating (investor)
  if (filters.durability_rating !== undefined) {
    const minRating = filters.durability_rating;
    requiredAttributes.push({
      slug: "durability-rating",
      predicate: (v) => Number(v) >= minRating,
    });
    filtersApplied.push(`durability_rating>=${minRating}`);
  }

  // Room type
  if (filters.room_type) {
    const room = filters.room_type.toLowerCase();
    requiredAttributes.push({
      slug: "suitable-rooms",
      predicate: (v) => v.toLowerCase().split(",").map((r) => r.trim()).includes(room),
    });
    filtersApplied.push(`room_type=${filters.room_type}`);
  }

  // Apply attribute filters with "null = include" semantics
  if (requiredAttributes.length) {
    products = products.filter((p) => {
      const attrMap: Record<string, string> = {};
      for (const pa of p.product_attributes ?? []) {
        if (pa.attributes?.slug) attrMap[pa.attributes.slug] = pa.value;
      }
      return requiredAttributes.every(({ slug, predicate }) => {
        const val = attrMap[slug];
        if (val === undefined) return true; // null = include (MVP)
        return predicate(val);
      });
    });
  }

  // Budget filters: applied at variant level. If product has any variant in budget, include it.
  if (filters.budget_per_sqm !== undefined) {
    const max = filters.budget_per_sqm;
    const before = products.length;
    products = products.filter((p) => {
      const variants = (p.product_variants ?? []) as any[];
      const priced = variants.filter((v) => v.price_per_sqm != null);
      if (priced.length === 0) return true; // no price data = include for MVP
      return priced.some((v) => Number(v.price_per_sqm) <= max);
    });
    if (before === products.length && products.every((p) => (p.product_variants ?? []).every((v: any) => v.price_per_sqm == null))) {
      filtersSkipped.push(`budget_per_sqm (no price data on any product)`);
    } else {
      filtersApplied.push(`budget_per_sqm<=${max}`);
    }
  }

  // Step 3: shape the response
  const shaped: RecommendedProduct[] = products.map((p) => {
    const attrs: Record<string, string> = {};
    for (const pa of p.product_attributes ?? []) {
      if (pa.attributes?.slug) attrs[pa.attributes.slug] = pa.value;
    }
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      description: p.description,
      short_description: p.short_description,
      image_url: p.image_url,
      spec_sheet_url: p.spec_sheet_url,
      category: p.categories
        ? { id: p.categories.id, name: p.categories.name, slug: p.categories.slug }
        : null,
      variants: ((p.product_variants ?? []) as any[])
        .filter((v) => v.is_active)
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          colour_name: v.colour_name,
          size_label: v.size_label,
          price_per_sqm: v.price_per_sqm,
        })),
      attributes: attrs,
    };
  });

  return {
    products: shaped,
    total: shaped.length,
    filters_applied: filtersApplied,
    filters_skipped: filtersSkipped,
  };
}