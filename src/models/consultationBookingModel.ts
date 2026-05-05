import { createAdminClient } from "../lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface ConsultationBooking {
  id: string;
  full_name: string;
  email: string;
  preferred_date: string; // ISO date string (YYYY-MM-DD)
  preferred_time: string; // Time string (HH:MM:SS)
  project_summary: string;
  referral_source: string | null;
  status: BookingStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  full_name: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  project_summary: string;
  referral_source?: string;
}

export interface UpdateBookingInput {
  status?: BookingStatus;
  admin_notes?: string;
}

export interface ListBookingsOptions {
  status?: BookingStatus;
  limit?: number;
  offset?: number;
}

// ─── Public Queries ──────────────────────────────────────────

// Public-facing: anyone can submit a booking via the funnel.
export async function createBooking(input: CreateBookingInput): Promise<ConsultationBooking> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("consultation_bookings")
    .insert(input)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to create booking", status: 400 };
  return data as ConsultationBooking;
}

// ─── Admin Queries ───────────────────────────────────────────

export async function getBookingById(id: string): Promise<ConsultationBooking | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw { message: "Failed to fetch booking", status: 500 };
  return data as ConsultationBooking | null;
}

export async function listBookings(options: ListBookingsOptions = {}): Promise<ConsultationBooking[]> {
  const supabase = createAdminClient();
  const { status, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("consultation_bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw { message: "Failed to fetch bookings", status: 500 };
  return data as ConsultationBooking[];
}

export async function updateBooking(
  id: string,
  input: UpdateBookingInput
): Promise<ConsultationBooking> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("consultation_bookings")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { message: error.message || "Failed to update booking", status: 400 };
  return data as ConsultationBooking;
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("consultation_bookings")
    .delete()
    .eq("id", id);

  if (error) throw { message: error.message || "Failed to delete booking", status: 400 };
}