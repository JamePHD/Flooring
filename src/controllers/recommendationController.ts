import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildFiltersFromSession,
  getRecommendations,
  RecommendationFilters,
} from "../models/recommendationModel";

// ─── Validation Schemas ──────────────────────────────────────

const querySchema = z.object({
  session_token: z.string().uuid("Invalid session token"),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

// Generates a helpful no-results message based on what filters were applied.
function buildNoResultsMessage(filtersApplied: string[]): string {
  if (filtersApplied.length === 0) {
    return "No products available at the moment. Please contact us for advice.";
  }
  return "No products match all your criteria. Try adjusting your filters or contact us for personalised advice.";
}

// ─── Handlers ────────────────────────────────────────────────

// GET /api/recommendations?session_token=...&limit=20
export async function getRecommendationsHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      session_token: searchParams.get("session_token") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { session_token, limit } = parsed.data;

    // Look up the qualifying session and translate answers into filters.
    const filters: RecommendationFilters | null = await buildFiltersFromSession(session_token);

    if (filters === null) {
      return NextResponse.json(
        { error: "Qualifying session not found" },
        { status: 404 }
      );
    }

    const result = await getRecommendations(filters, limit ?? 20);

    // AC#6: empty result needs a helpful response, not just an empty array.
    if (result.products.length === 0) {
      return NextResponse.json({
        products: [],
        total: 0,
        filters_applied: result.filters_applied,
        filters_skipped: result.filters_skipped,
        message: buildNoResultsMessage(result.filters_applied),
        no_results: true,
      });
    }

    return NextResponse.json({
      products: result.products,
      total: result.total,
      filters_applied: result.filters_applied,
      filters_skipped: result.filters_skipped,
      no_results: false,
    });
  } catch (err) {
    return handleError(err);
  }
}