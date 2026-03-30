export interface AdminProfile {
    id: string; 
    email: string; 
    user_id: string; 
    full_name: string; 
    role: "admin" | "super_admin";
    is_active: boolean; 
    created_at: string; 
    updated_at: string; 
}

export interface LoginCredentials{
    email: string; 
    password: string; 
}

export interface AuthResponse {
    user: AdminProfile;
    access_token: string; 
    refresh_token: string; 
}

export interface AuthError {
    message: string; 
    status: number; 
}

/** 
 * Look up an admin profile by their Supabase auth user_id.
 * Uses the admin client (bypasses RLS) because this runs
 * BEFORE we know if the user is a valid admin.
 * @param userId - The UUID from superbase auth.users 
 * @returns The admin profile, or null if found / inactive

**/ 

import { createAdminClient } from "../lib/supabase/admin"; 

export async function getAdminByUserId(
    userId : string 
): Promise<AdminProfile | null> {

const supabase = createAdminClient(); 
const {data, error} = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single(); 

    if (error || !data) return null;
    return data as AdminProfile; 

}

/**
 * Look up an admin profile by their email address.
 * Useful for checking if a user is an admin before/after login.
 *
 * @param email - The admin's email address
 * @returns The admin profile, or null if not found
 */ 

export async function getAdminByEmail(
    email: string 
): Promise<AdminProfile | null> { 

const supabase = createAdminClient();
const {data, error} = await supabase 
    .from ("admin_profiles")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .single(); 

    if (error || !data) return null; 
    return data as AdminProfile; 


}