import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export type LeadType = "quote" | "consultation";
export type LeadFilterStatus = "pending" | "contacted" | "in_progress" | "closed";

/**
 * Unified lead representation. Combines fields from quotes and consultation_bookings
 * into a common shape for the admin UI. Type-specific fields are nullable.
 */
export interface Lead {
  type: LeadType;
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  read_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;

  // Quote-specific (null for bookings)
  selected_products: { product_id: string; variant_id?: string }[] | null;
  square_meterage: number | null;
  room_type: string | null;
  project_description: string | null;
  preferred_contact_method: string | null;
  preferred_timeframe: string | null;
  num_properties: number | null;
  total_sqm: number | null;
  user_path: string | null;

  // Booking-specific (null for quotes)
  preferred_date: string | null;
  preferred_time: string | null;
  project_summary: string | null;
  referral_source: string | null;
}

export interface ListLeadsOptions {
  type?: LeadType;
  status?: LeadFilterStatus;
  unread_only?: boolean;
  date_from?: string; // ISO date YYYY-MM-DD
  date_to?: string;
  limit?: number;
  offset?: number;
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * Fetch leads from quotes and/or consultation_bookings, merged and sorted by created_at desc.
 */
export async function listLeads(options: ListLeadsOptions = {}): Promise<Lead[]> {
  const supabase = createAdminClient();
  const {
    type,
    status,
    unread_only,
    date_from,
    date_to,
    limit = 50,
    offset = 0,
  } = options;

  const fetchQuotes = async (): Promise<Lead[]> => {
    let q = supabase.from("quotes").select("*");
    if (status) q = q.eq("status", status);
    if (unread_only) q = q.is("read_at", null);
    if (date_from) q = q.gte("created_at", `${date_from}T00:00:00Z`);
    if (date_to) q = q.lte("created_at", `${date_to}T23:59:59Z`);

    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw { message: "Failed to fetch quotes", status: 500 };

    return (data ?? []).map((q): Lead => ({
      type: "quote",
      id: q.id,
      full_name: q.full_name,
      email: q.email,
      phone: q.phone,
      status: q.status,
      read_at: q.read_at,
      admin_notes: q.admin_notes,
      created_at: q.created_at,
      updated_at: q.updated_at,
      selected_products: q.selected_products,
      square_meterage: q.square_meterage,
      room_type: q.room_type,
      project_description: q.project_description,
      preferred_contact_method: q.preferred_contact_method,
      preferred_timeframe: q.preferred_timeframe,
      num_properties: q.num_properties,
      total_sqm: q.total_sqm,
      user_path: q.user_path,
      preferred_date: null,
      preferred_time: null,
      project_summary: null,
      referral_source: null,
    }));
  };

  const fetchBookings = async (): Promise<Lead[]> => {
    let q = supabase.from("consultation_bookings").select("*");
    if (status) q = q.eq("status", status);
    if (unread_only) q = q.is("read_at", null);
    if (date_from) q = q.gte("created_at", `${date_from}T00:00:00Z`);
    if (date_to) q = q.lte("created_at", `${date_to}T23:59:59Z`);

    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw { message: "Failed to fetch consultation bookings", status: 500 };

    return (data ?? []).map((b): Lead => ({
      type: "consultation",
      id: b.id,
      full_name: b.full_name,
      email: b.email,
      phone: null,
      status: b.status,
      read_at: b.read_at,
      admin_notes: b.admin_notes,
      created_at: b.created_at,
      updated_at: b.updated_at,
      selected_products: null,
      square_meterage: null,
      room_type: null,
      project_description: null,
      preferred_contact_method: null,
      preferred_timeframe: null,
      num_properties: null,
      total_sqm: null,
      user_path: null,
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      project_summary: b.project_summary,
      referral_source: b.referral_source,
    }));
  };

  // Fetch one or both tables in parallel based on the type filter.
  const [quotes, bookings] = await Promise.all([
    type === "consultation" ? Promise.resolve<Lead[]>([]) : fetchQuotes(),
    type === "quote" ? Promise.resolve<Lead[]>([]) : fetchBookings(),
  ]);

  // Merge and sort newest first
  const merged = [...quotes, ...bookings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Paginate after merge — over-fetches per source, but simpler than calculating per-source offsets.
  // For typical lead volumes this is fine; revisit if either table grows past a few thousand rows.
  return merged.slice(offset, offset + limit);
}

/**
 * Mark a quote lead as read.
 * Idempotent: if already read, leaves read_at unchanged.
 */
export async function markQuoteRead(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("quotes")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) throw { message: "Failed to mark quote as read", status: 500 };
}

/**
 * Mark a consultation booking lead as read.
 * Idempotent: if already read, leaves read_at unchanged.
 */
export async function markBookingRead(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("consultation_bookings")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) throw { message: "Failed to mark booking as read", status: 500 };
}

/**
 * Verify a lead exists by type and id. Used for 404 detection in the controller.
 */
export async function leadExists(type: LeadType, id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const table = type === "quote" ? "quotes" : "consultation_bookings";

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw { message: "Failed to check lead existence", status: 500 };
  return data !== null;
}