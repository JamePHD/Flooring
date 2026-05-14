import { NextResponse } from "next/server";
import { createServerClient } from "@/src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug,description,image_url,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Supabase categories query error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Categories API error", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
