import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export type UserPath = "diy_homeowner" | "architect_designer" | "property_investor";

export interface DIYHomeownerAnswers {
  project_type?: "new_build" | "renovation";
  room_type?: string;
  budget_range?: string;
  lifestyle_needs?: string[];
}

export interface ArchitectDesignerAnswers {
  project_type?: "residential" | "commercial";
  performance_attributes?: string[];
  needs_specification_sheets?: boolean;
}

export interface PropertyInvestorAnswers {
  num_properties?: number;
  budget_per_sqm?: number;
  durability_rating?: number;
}

export type QualifyingAnswers =
  | DIYHomeownerAnswers
  | ArchitectDesignerAnswers
  | PropertyInvestorAnswers;

export interface QualifyingSession {
  id: string;
  session_token: string;
  user_path: UserPath;
  answers: QualifyingAnswers;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionInput {
  user_path: UserPath;
}

export interface UpdateAnswersInput {
  answers: QualifyingAnswers;
}

// ─── Queries ─────────────────────────────────────────────────
// Note: all operations use the admin client because sessions are anonymous
// (no authenticated user) and RLS is enabled with no public policies.

export async function createSession(input: CreateSessionInput): Promise<QualifyingSession> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("qualifying_sessions")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create qualifying session", status: 400 };
  return data as QualifyingSession;
}

export async function getSessionByToken(token: string): Promise<QualifyingSession | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("qualifying_sessions")
    .select("*")
    .eq("session_token", token)
    .maybeSingle();

  if (error) throw { message: "Failed to fetch qualifying session", status: 500 };
  return data as QualifyingSession | null;
}

// Merges new answers into existing JSONB (shallow merge).
// Frontend can save one question at a time as user progresses through the flow.
export async function updateAnswers(
  token: string,
  input: UpdateAnswersInput
): Promise<QualifyingSession> {
  const supabase = createAdminClient();

  const existing = await getSessionByToken(token);
  if (!existing) throw { message: "Qualifying session not found", status: 404 };

  const mergedAnswers = { ...existing.answers, ...input.answers };

  const { data, error } = await supabase
    .from("qualifying_sessions")
    .update({ answers: mergedAnswers })
    .eq("session_token", token)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update answers", status: 400 };
  return data as QualifyingSession;
}

export async function markComplete(token: string): Promise<QualifyingSession> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("qualifying_sessions")
    .update({ is_complete: true })
    .eq("session_token", token)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to mark session complete", status: 400 };
  return data as QualifyingSession;
}
