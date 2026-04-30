import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  getSessionByToken,
  updateAnswers,
  markComplete,
  UserPath,
} from "../models/qualifyingSessionModel";

// ─── Validation Schemas ──────────────────────────────────────

const userPathSchema = z.enum([
  "diy_homeowner",
  "architect_designer",
  "property_investor",
]);

const createSessionSchema = z.object({
  user_path: userPathSchema,
});

// Per-path answer schemas. All fields optional because the multi-step flow
// saves one question at a time (AC#1).
const diyHomeownerAnswersSchema = z.object({
  project_type: z.enum(["new_build", "renovation"]).optional(),
  room_type: z.string().min(1).max(100).optional(),
  budget_range: z.string().min(1).max(50).optional(),
  lifestyle_needs: z.array(z.string().min(1).max(50)).max(20).optional(),
});

const architectDesignerAnswersSchema = z.object({
  project_type: z.enum(["residential", "commercial"]).optional(),
  performance_attributes: z.array(z.string().min(1).max(50)).max(20).optional(),
  needs_specification_sheets: z.boolean().optional(),
});

const propertyInvestorAnswersSchema = z.object({
  num_properties: z.number().int().positive().max(10000).optional(),
  budget_per_sqm: z.number().positive().max(100000).optional(),
  durability_rating: z.number().int().min(1).max(5).optional(),
});

const answersSchemaByPath: Record<UserPath, z.ZodTypeAny> = {
  diy_homeowner: diyHomeownerAnswersSchema,
  architect_designer: architectDesignerAnswersSchema,
  property_investor: propertyInvestorAnswersSchema,
};

const updateAnswersBodySchema = z.object({
  answers: z.record(z.unknown()),
});

// ─── Helpers ─────────────────────────────────────────────────

function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  return NextResponse.json(
    { error: e.message || "Internal server error" },
    { status: e.status || 500 }
  );
}

// ─── Handlers ────────────────────────────────────────────────

// POST /api/qualifying-sessions
export async function createSessionHandler(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const session = await createSession(parsed.data);

    // Only return the token to the client; internal id stays server-side.
    return NextResponse.json(
      {
        session_token: session.session_token,
        user_path: session.user_path,
        answers: session.answers,
        is_complete: session.is_complete,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/qualifying-sessions/[token]
export async function getSessionHandler(token: string) {
  try {
    const session = await getSessionByToken(token);

    if (!session) {
      return NextResponse.json(
        { error: "Qualifying session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session_token: session.session_token,
      user_path: session.user_path,
      answers: session.answers,
      is_complete: session.is_complete,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/qualifying-sessions/[token]
export async function updateAnswersHandler(req: Request, token: string) {
  try {
    const body = await req.json();
    const parsedBody = updateAnswersBodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    // Look up the session so we know which path's schema to validate against.
    const existing = await getSessionByToken(token);
    if (!existing) {
      return NextResponse.json(
        { error: "Qualifying session not found" },
        { status: 404 }
      );
    }

    const answersSchema = answersSchemaByPath[existing.user_path];
    const parsedAnswers = answersSchema.safeParse(parsedBody.data.answers);

    if (!parsedAnswers.success) {
      return NextResponse.json(
        {
          error: `Invalid answers for path ${existing.user_path}`,
          details: parsedAnswers.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updated = await updateAnswers(token, { answers: parsedAnswers.data });

    return NextResponse.json({
      session_token: updated.session_token,
      user_path: updated.user_path,
      answers: updated.answers,
      is_complete: updated.is_complete,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/qualifying-sessions/[token]/complete
export async function markCompleteHandler(token: string) {
  try {
    const existing = await getSessionByToken(token);
    if (!existing) {
      return NextResponse.json(
        { error: "Qualifying session not found" },
        { status: 404 }
      );
    }

    const updated = await markComplete(token);

    return NextResponse.json({
      session_token: updated.session_token,
      user_path: updated.user_path,
      answers: updated.answers,
      is_complete: updated.is_complete,
    });
  } catch (err) {
    return handleError(err);
  }
}
