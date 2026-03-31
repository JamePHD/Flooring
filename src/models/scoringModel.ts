import { createServerClient } from "../lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────

export interface ScoringWeight {
  attribute_id: string;
  weight: number; // 0 to 1, how important this attribute is
  preferred_value?: string; // for text attributes, what they want
  preferred_min?: number; // for number attributes, minimum
  preferred_max?: number; // for number attributes, maximum
}

export interface ScoringRequest {
  category_slug?: string;
  weights: ScoringWeight[];
  limit?: number;
}

export interface ScoredProduct {
  product_id: string;
  name: string;
  slug: string;
  brand: string | null;
  image_url: string | null;
  category_name: string | null;
  score: number; // 0 to 100
  breakdown: {
    attribute_name: string;
    value: string;
    weight: number;
    points: number;
  }[];
  lowest_price: number | null;
}

// ─── Scoring Logic ───────────────────────────────────────────

export async function scoreProducts(
  request: ScoringRequest
): Promise<ScoredProduct[]> {
  const supabase = createServerClient();

  // Step 1 — Fetch active products (optionally filtered by category)
  let productQuery = supabase
    .from("products")
    .select("id, name, slug, brand, image_url, category_id, categories(name, slug)")
    .eq("is_active", true);

  if (request.category_slug) {
    productQuery = productQuery.eq("categories.slug", request.category_slug);
  }

  const { data: products, error: productError } = await productQuery;
  if (productError) throw { message: "Failed to fetch products", status: 500 };
  if (!products || products.length === 0) return [];

  const productIds = products.map((p: any) => p.id);

  // Step 2 — Fetch all attribute values for these products
  const { data: productAttrs, error: attrError } = await supabase
    .from("product_attributes")
    .select("product_id, attribute_id, value")
    .in("product_id", productIds);

  if (attrError) throw { message: "Failed to fetch product attributes", status: 500 };

  // Step 3 — Fetch attribute metadata for names and data types
  const attrIds = request.weights.map((w) => w.attribute_id);
  const { data: attrMeta, error: metaError } = await supabase
    .from("attributes")
    .select("id, name, data_type, unit")
    .in("id", attrIds);

  if (metaError) throw { message: "Failed to fetch attribute metadata", status: 500 };

const attrMap = new Map<string, { id: string; name: string; data_type: string; unit: string | null }>(
  (attrMeta || []).map((a: any) => [a.id, a])
);

  // Step 4 — Fetch lowest price per product from variants
  const { data: variants } = await supabase
    .from("product_variants")
    .select("product_id, price_per_sqm, price_per_unit")
    .in("product_id", productIds)
    .eq("is_active", true);

  const priceMap = new Map<string, number>();
  (variants || []).forEach((v: any) => {
    const price = v.price_per_sqm || v.price_per_unit || 0;
    if (price > 0) {
      const current = priceMap.get(v.product_id);
      if (!current || price < current) {
        priceMap.set(v.product_id, price);
      }
    }
  });

  // Step 5 — Build lookup of all numeric values per attribute for normalisation
  const numericRanges = new Map<string, { min: number; max: number }>();
  request.weights.forEach((w) => {
    const meta = attrMap.get(w.attribute_id);
    if (meta && meta.data_type === "number") {
      const values = (productAttrs || [])
        .filter((pa: any) => pa.attribute_id === w.attribute_id)
        .map((pa: any) => parseFloat(pa.value))
        .filter((v: number) => !isNaN(v));

      if (values.length > 0) {
        numericRanges.set(w.attribute_id, {
          min: Math.min(...values),
          max: Math.max(...values),
        });
      }
    }
  });

  // Step 6 — Score each product
  const totalWeight = request.weights.reduce((sum, w) => sum + w.weight, 0);

  const scored: ScoredProduct[] = products.map((product: any) => {
    const attrs = (productAttrs || []).filter(
      (pa: any) => pa.product_id === product.id
    );

    let totalPoints = 0;
    const breakdown: ScoredProduct["breakdown"] = [];

    request.weights.forEach((weight) => {
      const meta = attrMap.get(weight.attribute_id);
      if (!meta) return;

      const productAttr = attrs.find(
        (a: any) => a.attribute_id === weight.attribute_id
      );

      let points = 0;

      if (productAttr) {
        if (meta.data_type === "boolean") {
          // Boolean: true = full points if preferred, or just having it
          const boolVal = productAttr.value.toLowerCase() === "true";
          const preferred =
            weight.preferred_value?.toLowerCase() !== "false";
          points = boolVal === preferred ? weight.weight : 0;
        } else if (meta.data_type === "number") {
          const numVal = parseFloat(productAttr.value);
          const range = numericRanges.get(weight.attribute_id);

          if (!isNaN(numVal) && range && range.max !== range.min) {
            if (
              weight.preferred_min !== undefined ||
              weight.preferred_max !== undefined
            ) {
              // User specified a range preference
              const min = weight.preferred_min ?? range.min;
              const max = weight.preferred_max ?? range.max;
              if (numVal >= min && numVal <= max) {
                points = weight.weight;
              } else {
                // Partial credit based on distance
                const dist = numVal < min ? min - numVal : numVal - max;
                const maxDist = range.max - range.min;
                points = Math.max(0, weight.weight * (1 - dist / maxDist));
              }
            } else {
              // No preference, normalise: higher = better
              points =
                weight.weight *
                ((numVal - range.min) / (range.max - range.min));
            }
          }
        } else {
          // Text: exact match = full points
          if (
            weight.preferred_value &&
            productAttr.value.toLowerCase() ===
              weight.preferred_value.toLowerCase()
          ) {
            points = weight.weight;
          } else if (!weight.preferred_value) {
            // No preference specified, give partial credit for having a value
            points = weight.weight * 0.5;
          }
        }
      }

      totalPoints += points;

      breakdown.push({
        attribute_name: meta.name,
        value: productAttr?.value || "N/A",
        weight: weight.weight,
        points: Math.round(points * 100) / 100,
      });
    });

    // Normalise score to 0-100
    const score =
      totalWeight > 0
        ? Math.round((totalPoints / totalWeight) * 100)
        : 0;

    const category = product.categories as any;

    return {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      image_url: product.image_url,
      category_name: category?.name || null,
      score,
      breakdown,
      lowest_price: priceMap.get(product.id) || null,
    };
  });

  // Step 7 — Sort by score descending and limit
  scored.sort((a, b) => b.score - a.score);
  const limit = request.limit || 10;

  return scored.slice(0, limit);
}