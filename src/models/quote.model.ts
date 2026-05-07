import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export type UserPath =
  | "diy_homeowner"
  | "architect_designer"
  | "property_investor";

// SCRUM-83 canonical lifecycle + legacy values for back-compat
// (rows already in the DB may have any of the legacy values; new
// admin actions should use the canonical set).
export type QuoteStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "quote_sent"
  | "closed_won"
  | "closed_lost"
  // legacy
  | "pending"
  | "completed"
  | "cancelled"
  | "closed";

export interface SelectedProduct {
  id: string;
  name?: string;
  quantity_sqm?: number;
}

export interface Quote {
  id: string;
  user_path: UserPath;
  full_name: string;
  email: string;
  phone: string | null;
  selected_products: SelectedProduct[];
  num_properties: number | null;
  total_sqm: number | null;
  customer_notes: string | null;
  session_token: string | null;
  status: QuoteStatus;
  admin_notes: string | null;
  // SCRUM-71 read tracking
  read_at?: string | null;
  // SCRUM-82 HubSpot sync tracking
  hubspot_synced_at?: string | null;
  hubspot_contact_id?: string | null;
  hubspot_deal_id?: string | null;
  hubspot_sync_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuoteInput {
  user_path: UserPath;
  full_name: string;
  email: string;
  phone?: string;
  selected_products: SelectedProduct[];
  num_properties?: number;
  total_sqm?: number;
  customer_notes?: string;
  session_token?: string;
}

export interface UpdateQuoteInput {
  status?: QuoteStatus;
  admin_notes?: string;
}

export interface ListQuotesOptions {
  status?: QuoteStatus;
  user_path?: UserPath;
  limit?: number;
  offset?: number;
}

// ─── Public Queries ──────────────────────────────────────────

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert(input)
    .select()
    .single();

  if (error)
    throw { message: error.message || "Failed to create quote", status: 400 };
  return data as Quote;
}

// ─── Admin Queries ───────────────────────────────────────────

export async function getQuoteById(id: string): Promise<Quote | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch quote", status: 500 };
  return data as Quote | null;
}

export async function listQuotes(
  options: ListQuotesOptions = {}
): Promise<Quote[]> {
  const supabase = createAdminClient();
  const { status, user_path, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (user_path) query = query.eq("user_path", user_path);

  const { data, error } = await query;
  if (error) throw { message: "Failed to fetch quotes", status: 500 };
  return data as Quote[];
}

export async function updateQuote(
  id: string,
  input: UpdateQuoteInput
): Promise<Quote> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error)
    throw { message: error.message || "Failed to update quote", status: 400 };
  return data as Quote;
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error)
    throw { message: error.message || "Failed to delete quote", status: 400 };
}

// SCRUM-82 — record HubSpot sync outcome on the quote row.
// Best-effort: log on failure but don't throw (caller already returned 201).
export async function recordQuoteHubspotSync(
  id: string,
  result:
    | { ok: true; contactId: string; dealId?: string }
    | { ok: false; error: string }
): Promise<void> {
  const supabase = createAdminClient();
  const update = result.ok
    ? {
        hubspot_synced_at: new Date().toISOString(),
        hubspot_contact_id: result.contactId,
        hubspot_deal_id: result.dealId ?? null,
        hubspot_sync_error: null,
      }
    : {
        hubspot_sync_error: result.error.slice(0, 2000),
      };
  const { error } = await supabase.from("quotes").update(update).eq("id", id);
  if (error) {
    console.error(
      `[hubspot] failed to record sync status on quote ${id}:`,
      error.message
    );
  }
}
