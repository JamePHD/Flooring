import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export type QuoteStatus =
  | "pending"
  | "contacted"
  | "quoted"
  | "won"
  | "lost"
  | "expired";

export type ContactMethod = "email" | "phone" | "either";

export type UserPath = "diy_homeowner" | "architect_designer" | "property_investor";

export interface SelectedProduct {
  product_id: string;
  variant_id?: string;
}

export interface Quote {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  selected_products: SelectedProduct[];
  square_meterage: number;
  room_type: string;
  project_description: string;
  preferred_contact_method: ContactMethod;
  preferred_timeframe: string;
  num_properties: number | null;
  total_sqm: number | null;
  session_token: string | null;
  user_path: UserPath | null;
  status: QuoteStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuoteInput {
  full_name: string;
  email: string;
  phone: string;
  selected_products: SelectedProduct[];
  square_meterage: number;
  room_type: string;
  project_description: string;
  preferred_contact_method: ContactMethod;
  preferred_timeframe: string;
  num_properties?: number;
  total_sqm?: number;
  session_token?: string;
  user_path?: UserPath;
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

  if (error) throw { message: error.message || "Failed to create quote", status: 400 };
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

export async function listQuotes(options: ListQuotesOptions = {}): Promise<Quote[]> {
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

  if (error) throw { message: error.message || "Failed to update quote", status: 400 };
  return data as Quote;
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) throw { message: error.message || "Failed to delete quote", status: 400 };
}