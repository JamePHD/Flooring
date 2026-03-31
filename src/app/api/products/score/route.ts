import { NextRequest, NextResponse } from "next/server";
import { handleScoreProducts } from "@/controllers/scoringController";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const results = await handleScoreProducts(body);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to score products" },
      { status: error.status || 500 }
    );
  }
}