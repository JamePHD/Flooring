import { createAdminClient } from "../lib/supabase/admin";
import type { SelectedProduct } from "./quote.model";

// ─── Types ───────────────────────────────────────────────────

export type LeadType = "quote" | "consultation";
// Combined status enum across both lead types.
// SCRUM-83 introduces the new canonical lifecycle (new/contacted/...);
// legacy values from earlier sprints kept for back-compat.
export type LeadStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "quote_sent"
  | "closed_won"
  | "closed_lost"
  // legacy
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "closed";

// AC#8: Lead objects have all expected fields, with type-specific fields
// nullable for the wrong type.
export interface Lead {
  lead_type: LeadType;

  // Common
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  admin_notes: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;

  // SCRUM-86 duplicate flag (AC#3)
  is_duplicate: boolean;
  duplicate_of_lead_type: LeadType | null;
  duplicate_of_lead_id: string | null;
  duplicate_dismissed_at: string | null;
  duplicate_dismissed_by: string | null;

  // Quote-specific (null when lead_type === "consultation")
  user_path: string | null;
  selected_products: SelectedProduct[] | null;
  num_properties: number | null;
  total_sqm: number | null;
  customer_notes: string | null;
  session_token: string | null;

  // Consultation-specific (null when lead_type === "quote")
  preferred_date: string | null;
  preferred_time: string | null;
  project_summary: string | null;
  referral_source: string | null;
}

export interface ListLeadsOptions {
  type?: LeadType;
  status?: string;
  unread_only?: boolean;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  // SCRUM-84
  search?: string; // matches name/email/phone (phone only on quotes)
  user_path?: string; // quote-only field; if set, bookings are excluded
  product_interest?: string; // matches selected_products[].name on quotes;
                             // if set, bookings are excluded
  limit?: number;
  offset?: number;
}

// ─── Helpers ─────────────────────────────────────────────────

interface DupeFields {
  is_duplicate: boolean | null;
  duplicate_of_lead_type: LeadType | null;
  duplicate_of_lead_id: string | null;
  duplicate_dismissed_at: string | null;
  duplicate_dismissed_by: string | null;
}

interface RawQuote extends DupeFields {
  id: string;
  user_path: string;
  full_name: string;
  email: string;
  phone: string | null;
  selected_products: SelectedProduct[];
  num_properties: number | null;
  total_sqm: number | null;
  customer_notes: string | null;
  session_token: string | null;
  status: string;
  admin_notes: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawBooking extends DupeFields {
  id: string;
  full_name: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  project_summary: string;
  referral_source: string | null;
  status: string;
  admin_notes: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

function quoteToLead(q: RawQuote): Lead {
  return {
    lead_type: "quote",
    id: q.id,
    full_name: q.full_name,
    email: q.email,
    phone: q.phone,
    status: q.status,
    admin_notes: q.admin_notes,
    read_at: q.read_at,
    created_at: q.created_at,
    updated_at: q.updated_at,
    is_duplicate: q.is_duplicate ?? false,
    duplicate_of_lead_type: q.duplicate_of_lead_type,
    duplicate_of_lead_id: q.duplicate_of_lead_id,
    duplicate_dismissed_at: q.duplicate_dismissed_at,
    duplicate_dismissed_by: q.duplicate_dismissed_by,
    user_path: q.user_path,
    selected_products: q.selected_products,
    num_properties: q.num_properties,
    total_sqm: q.total_sqm,
    customer_notes: q.customer_notes,
    session_token: q.session_token,
    preferred_date: null,
    preferred_time: null,
    project_summary: null,
    referral_source: null,
  };
}

function bookingToLead(b: RawBooking): Lead {
  return {
    lead_type: "consultation",
    id: b.id,
    full_name: b.full_name,
    email: b.email,
    phone: null,
    status: b.status,
    admin_notes: b.admin_notes,
    read_at: b.read_at,
    created_at: b.created_at,
    updated_at: b.updated_at,
    is_duplicate: b.is_duplicate ?? false,
    duplicate_of_lead_type: b.duplicate_of_lead_type,
    duplicate_of_lead_id: b.duplicate_of_lead_id,
    duplicate_dismissed_at: b.duplicate_dismissed_at,
    duplicate_dismissed_by: b.duplicate_dismissed_by,
    user_path: null,
    selected_products: null,
    num_properties: null,
    total_sqm: null,
    customer_notes: null,
    session_token: null,
    preferred_date: b.preferred_date,
    preferred_time: b.preferred_time,
    project_summary: b.project_summary,
    referral_source: b.referral_source,
  };
}

// ─── Combined query ──────────────────────────────────────────

// AC#1: returns combined list of quotes and consultation bookings,
// sorted by created_at desc.
// AC#3: ?type filter selects one source.
// AC#4: ?status filters across both types.
// AC#5: ?unread_only=true filters by read_at IS NULL.
// AC#6: ?date_from/?date_to filters by created_at.
export async function listLeads(
  options: ListLeadsOptions = {}
): Promise<Lead[]> {
  const supabase = createAdminClient();
  const {
    type,
    status,
    unread_only,
    date_from,
    date_to,
    search,
    user_path,
    product_interest,
    limit = 100,
    offset = 0,
  } = options;

  // SCRUM-84 — quote-only filters force the query to skip bookings
  // (those tables don't have user_path or selected_products).
  const quoteOnlyFilter =
    user_path !== undefined || product_interest !== undefined;

  const fetchQuotes = type === "consultation" ? false : true;
  const fetchBookings =
    type === "quote" || quoteOnlyFilter ? false : true;

  const dateFromIso = date_from ? `${date_from}T00:00:00Z` : undefined;
  // Inclusive upper bound: end of the to-day in UTC.
  const dateToIso = date_to ? `${date_to}T23:59:59.999Z` : undefined;

  // SCRUM-84 search — escape % and , (Supabase PostgREST `.or()` separator)
  // from user input to keep the filter expression clean.
  const escapeSearch = (s: string) =>
    s.replace(/[%,]/g, (m) => "\\" + m).replace(/\*/g, "");
  const searchTerm = search?.trim() ? `%${escapeSearch(search.trim())}%` : null;

  const quotesPromise = fetchQuotes
    ? (async () => {
        let q = supabase.from("quotes").select("*");
        if (status) q = q.eq("status", status);
        if (unread_only) q = q.is("read_at", null);
        if (dateFromIso) q = q.gte("created_at", dateFromIso);
        if (dateToIso) q = q.lte("created_at", dateToIso);
        if (user_path) q = q.eq("user_path", user_path);
        if (searchTerm) {
          // Quotes search across name + email + phone
          q = q.or(
            `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
          );
        }
        const { data, error } = await q;
        if (error) throw { message: "Failed to list quote leads", status: 500 };
        let leads = (data as RawQuote[]).map(quoteToLead);
        // Product interest is a JSONB substring match — done in JS so we don't
        // need a custom Postgres function. List sizes are small (<200 typical).
        if (product_interest) {
          const needle = product_interest.trim().toLowerCase();
          leads = leads.filter((l) =>
            (l.selected_products ?? []).some((p) =>
              (p.name ?? "").toLowerCase().includes(needle)
            )
          );
        }
        return leads;
      })()
    : Promise.resolve([] as Lead[]);

  const bookingsPromise = fetchBookings
    ? (async () => {
        let q = supabase.from("consultation_bookings").select("*");
        if (status) q = q.eq("status", status);
        if (unread_only) q = q.is("read_at", null);
        if (dateFromIso) q = q.gte("created_at", dateFromIso);
        if (dateToIso) q = q.lte("created_at", dateToIso);
        if (searchTerm) {
          // Bookings have no phone column — search name + email only.
          q = q.or(
            `full_name.ilike.${searchTerm},email.ilike.${searchTerm}`
          );
        }
        const { data, error } = await q;
        if (error)
          throw { message: "Failed to list consultation leads", status: 500 };
        return (data as RawBooking[]).map(bookingToLead);
      })()
    : Promise.resolve([] as Lead[]);

  const [quoteLeads, bookingLeads] = await Promise.all([
    quotesPromise,
    bookingsPromise,
  ]);

  const merged = [...quoteLeads, ...bookingLeads];
  merged.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return merged.slice(offset, offset + limit);
}

// ─── Read tracking ───────────────────────────────────────────

export interface MarkReadResult {
  found: boolean;
  changed: boolean;
  read_at: string | null;
}

// AC#9 + AC#11: Sets read_at to now() only if currently null
// (idempotent — won't update timestamp on re-call).
export async function markQuoteRead(id: string): Promise<MarkReadResult> {
  return markRead("quotes", id);
}

export async function markBookingRead(id: string): Promise<MarkReadResult> {
  return markRead("consultation_bookings", id);
}

async function markRead(
  table: "quotes" | "consultation_bookings",
  id: string
): Promise<MarkReadResult> {
  const supabase = createAdminClient();

  // Existence check (AC#13 → 404 path)
  const { data: existing, error: getErr } = await supabase
    .from(table)
    .select("id, read_at")
    .eq("id", id)
    .maybeSingle();
  if (getErr) throw { message: "Failed to fetch lead", status: 500 };
  if (!existing) return { found: false, changed: false, read_at: null };

  if (existing.read_at) {
    return { found: true, changed: false, read_at: existing.read_at };
  }

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from(table)
    .update({ read_at: now })
    .eq("id", id)
    .is("read_at", null);
  if (updErr) throw { message: "Failed to mark lead read", status: 500 };

  return { found: true, changed: true, read_at: now };
}

// ─── SCRUM-83 Status history (AC#3) ──────────────────────────

export interface StatusHistoryRow {
  id: string;
  lead_type: LeadType;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
}

// Append a row to lead_status_history. Best-effort: log on failure but
// don't throw — the originating PATCH already succeeded.
export async function recordStatusChange(input: {
  leadType: LeadType;
  leadId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("lead_status_history").insert({
    lead_type: input.leadType,
    lead_id: input.leadId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    changed_by: input.changedBy,
  });
  if (error) {
    console.error(
      `[lead-status-history] failed to record ${input.leadType} ${input.leadId} ${input.fromStatus} → ${input.toStatus}:`,
      error.message
    );
  }
}

export async function listStatusHistory(
  leadType: LeadType,
  leadId: string
): Promise<StatusHistoryRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lead_status_history")
    .select("*")
    .eq("lead_type", leadType)
    .eq("lead_id", leadId)
    .order("changed_at", { ascending: false });
  if (error) throw { message: "Failed to load status history", status: 500 };
  return data as StatusHistoryRow[];
}

// ─── SCRUM-83 Lead notes (AC#4) ──────────────────────────────

export interface LeadNote {
  id: string;
  lead_type: LeadType;
  lead_id: string;
  body: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function addLeadNote(input: {
  leadType: LeadType;
  leadId: string;
  body: string;
  authorId: string;
}): Promise<LeadNote> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({
      lead_type: input.leadType,
      lead_id: input.leadId,
      body: input.body,
      author_id: input.authorId,
    })
    .select()
    .single();
  if (error)
    throw { message: error.message || "Failed to add note", status: 400 };
  return data as LeadNote;
}

export async function listLeadNotes(
  leadType: LeadType,
  leadId: string
): Promise<LeadNote[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_type", leadType)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw { message: "Failed to load notes", status: 500 };
  return data as LeadNote[];
}

export async function getLeadNoteById(noteId: string): Promise<LeadNote | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();
  if (error) throw { message: "Failed to fetch note", status: 500 };
  return data as LeadNote | null;
}

export async function deleteLeadNote(noteId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
  if (error)
    throw { message: error.message || "Failed to delete note", status: 400 };
}

// ─── SCRUM-86 Duplicate detection (AC#1, AC#2, AC#5) ─────────

export interface ExistingLeadRef {
  lead_type: LeadType;
  id: string;
  created_at: string;
}

// AC#1: cross-table search for existing leads with the same email
// (case-insensitive). Optionally exclude one lead — used by the create
// handlers to skip the row we just inserted. Returns rows ordered by
// created_at ASC so the OLDEST matching lead comes first (becomes the
// "original" when flagging).
export async function findExistingLeadsByEmail(
  email: string,
  exclude?: { lead_type: LeadType; id: string }
): Promise<ExistingLeadRef[]> {
  const supabase = createAdminClient();
  const normalised = email.trim().toLowerCase();

  const [quotesRes, bookingsRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, created_at")
      .ilike("email", normalised)
      .order("created_at", { ascending: true }),
    supabase
      .from("consultation_bookings")
      .select("id, created_at")
      .ilike("email", normalised)
      .order("created_at", { ascending: true }),
  ]);

  if (quotesRes.error || bookingsRes.error) {
    throw { message: "Failed to look up existing leads", status: 500 };
  }

  const quoteRefs: ExistingLeadRef[] = (quotesRes.data ?? []).map((r: any) => ({
    lead_type: "quote",
    id: r.id,
    created_at: r.created_at,
  }));
  const bookingRefs: ExistingLeadRef[] = (bookingsRes.data ?? []).map(
    (r: any) => ({
      lead_type: "consultation",
      id: r.id,
      created_at: r.created_at,
    })
  );

  const merged = [...quoteRefs, ...bookingRefs];
  if (exclude) {
    return merged.filter(
      (r) => !(r.lead_type === exclude.lead_type && r.id === exclude.id)
    );
  }
  return merged
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// AC#2: write the duplicate flag onto a lead row (the NEW submission),
// pointing at the OLDEST existing match. Best-effort — log on failure
// but don't throw (the originating create already returned 201, AC#5).
export async function flagAsDuplicate(
  leadType: LeadType,
  leadId: string,
  originalLeadType: LeadType,
  originalLeadId: string
): Promise<void> {
  const supabase = createAdminClient();
  const table = leadType === "quote" ? "quotes" : "consultation_bookings";
  const { error } = await supabase
    .from(table)
    .update({
      is_duplicate: true,
      duplicate_of_lead_type: originalLeadType,
      duplicate_of_lead_id: originalLeadId,
    })
    .eq("id", leadId);
  if (error) {
    console.error(
      `[duplicate-detection] failed to flag ${leadType} ${leadId}:`,
      error.message
    );
  }
}

// Top-level orchestrator called by the create handlers. Looks for older
// matches by email; if any found, flags this lead as a duplicate of the
// oldest one. Wrapped in try/catch — never propagates errors to the
// originating request handler (AC#5).
export async function detectAndFlagDuplicate(input: {
  leadType: LeadType;
  leadId: string;
  email: string;
}): Promise<{ flagged: boolean; original?: ExistingLeadRef }> {
  try {
    const existing = await findExistingLeadsByEmail(input.email, {
      lead_type: input.leadType,
      id: input.leadId,
    });
    if (existing.length === 0) return { flagged: false };
    // Sorted ASC by created_at — first is oldest = the canonical original
    const original = existing[0];
    await flagAsDuplicate(
      input.leadType,
      input.leadId,
      original.lead_type,
      original.id
    );
    return { flagged: true, original };
  } catch (err) {
    console.error(
      `[duplicate-detection] check failed for ${input.leadType} ${input.leadId}:`,
      err instanceof Error ? err.message : String(err)
    );
    return { flagged: false };
  }
}

// ─── SCRUM-86 Dismiss (AC#4) ────────────────────────────────

export async function dismissDuplicateFlag(
  leadType: LeadType,
  leadId: string,
  adminId: string
): Promise<{ found: boolean }> {
  const supabase = createAdminClient();
  const table = leadType === "quote" ? "quotes" : "consultation_bookings";

  const { data: existing, error: getErr } = await supabase
    .from(table)
    .select("id, is_duplicate")
    .eq("id", leadId)
    .maybeSingle();
  if (getErr) throw { message: "Failed to fetch lead", status: 500 };
  if (!existing) return { found: false };

  // Dismiss = clear the flag and stamp who dismissed it / when.
  const { error: updErr } = await supabase
    .from(table)
    .update({
      is_duplicate: false,
      duplicate_dismissed_at: new Date().toISOString(),
      duplicate_dismissed_by: adminId,
    })
    .eq("id", leadId);
  if (updErr) throw { message: "Failed to dismiss duplicate", status: 500 };
  return { found: true };
}

// ─── SCRUM-86 Merge (AC#4) ──────────────────────────────────

export interface MergeResult {
  primary_lead_id: string;
  duplicate_deleted: boolean;
  notes_moved: number;
  history_moved: number;
}

// Merge: re-parent the duplicate's notes + status history onto the
// primary, then DELETE the duplicate row. Primary is unchanged.
//
// The caller should pick the OLDER lead as primary by convention, but
// this function doesn't enforce that — the admin makes the call.
export async function mergeLeads(input: {
  primary: { lead_type: LeadType; id: string };
  duplicate: { lead_type: LeadType; id: string };
  adminId: string;
}): Promise<MergeResult> {
  const supabase = createAdminClient();
  const { primary, duplicate } = input;

  if (primary.lead_type === duplicate.lead_type && primary.id === duplicate.id) {
    throw {
      message: "Cannot merge a lead with itself",
      status: 400,
    };
  }

  // 1. Sanity-check both leads exist
  const primaryTable =
    primary.lead_type === "quote" ? "quotes" : "consultation_bookings";
  const duplicateTable =
    duplicate.lead_type === "quote" ? "quotes" : "consultation_bookings";

  const [primaryRes, duplicateRes] = await Promise.all([
    supabase.from(primaryTable).select("id").eq("id", primary.id).maybeSingle(),
    supabase
      .from(duplicateTable)
      .select("id")
      .eq("id", duplicate.id)
      .maybeSingle(),
  ]);

  if (primaryRes.error || duplicateRes.error) {
    throw { message: "Failed to verify leads for merge", status: 500 };
  }
  if (!primaryRes.data) {
    throw { message: "Primary lead not found", status: 404 };
  }
  if (!duplicateRes.data) {
    throw { message: "Duplicate lead not found", status: 404 };
  }

  // 2. Re-parent notes from duplicate → primary
  const { data: notesUpdated, error: notesErr } = await supabase
    .from("lead_notes")
    .update({ lead_type: primary.lead_type, lead_id: primary.id })
    .eq("lead_type", duplicate.lead_type)
    .eq("lead_id", duplicate.id)
    .select("id");
  if (notesErr)
    throw { message: "Failed to move notes during merge", status: 500 };

  // 3. Re-parent status history from duplicate → primary
  const { data: historyUpdated, error: historyErr } = await supabase
    .from("lead_status_history")
    .update({ lead_type: primary.lead_type, lead_id: primary.id })
    .eq("lead_type", duplicate.lead_type)
    .eq("lead_id", duplicate.id)
    .select("id");
  if (historyErr)
    throw { message: "Failed to move history during merge", status: 500 };

  // 4. Audit-log the merge as a history row on primary
  await supabase.from("lead_status_history").insert({
    lead_type: primary.lead_type,
    lead_id: primary.id,
    from_status: null,
    to_status: `merged_in:${duplicate.lead_type}:${duplicate.id}`,
    changed_by: input.adminId,
  });

  // 5. Delete the duplicate row
  const { error: delErr } = await supabase
    .from(duplicateTable)
    .delete()
    .eq("id", duplicate.id);
  if (delErr)
    throw { message: "Failed to delete duplicate after merge", status: 500 };

  return {
    primary_lead_id: primary.id,
    duplicate_deleted: true,
    notes_moved: notesUpdated?.length ?? 0,
    history_moved: historyUpdated?.length ?? 0,
  };
}
