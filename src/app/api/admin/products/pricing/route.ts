import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/src/middleware/authMiddleware";
import { createAdminClient } from "@/src/lib/supabase/admin";

// GET all variants with pricing for a product
export const GET = withAdminAuth(async (req, admin) => {
  const segments = req.nextUrl.pathname.split("/");
  const productId = segments[segments.indexOf("products") + 1];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("product_variants")
      .select("id, sku, colour_name, size_label, price_per_sqm, price_per_unit, is_active")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (error) throw { message: "Failed to fetch pricing", status: 500 };
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch pricing" },
      { status: error.status || 500 }
    );
  }
});

// Bulk update pricing for multiple variants at once
export const PUT = withAdminAuth(async (req, admin) => {
  const segments = req.nextUrl.pathname.split("/");
  const productId = segments[segments.indexOf("products") + 1];

  try {
    const body = await req.json();
    const { updates } = body;

    // Expects: { updates: [{ variant_id: "...", price_per_sqm: 45.99, price_per_unit: 89.99 }] }
    if (!updates || !Array.isArray(updates)) {
      throw { message: "Updates array is required", status: 400 };
    }

    const supabase = createAdminClient();
    const results = [];

    for (const update of updates) {
      const { variant_id, price_per_sqm, price_per_unit } = update;

      if (!variant_id) {
        throw { message: "variant_id is required for each update", status: 400 };
      }

      const { data, error } = await supabase
        .from("product_variants")
        .update({
          ...(price_per_sqm !== undefined && { price_per_sqm }),
          ...(price_per_unit !== undefined && { price_per_unit }),
        })
        .eq("id", variant_id)
        .eq("product_id", productId)
        .select("id, sku, price_per_sqm, price_per_unit")
        .single();

      if (error) throw { message: `Failed to update variant ${variant_id}`, status: 400 };
      results.push(data);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update pricing" },
      { status: error.status || 500 }
    );
  }
});