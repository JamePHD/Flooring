import { createAdminClient } from "../lib/supabase/admin";

import {
    AdminProfile,
    LoginCredentials,
    AuthResponse,
    getAdminByUserId,
} from "../models/adminModel";

export async function loginAdmin(
    credentials: LoginCredentials
): Promise<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
        throw { message: "Email and password are required", status: 400 };
    }

    const supabase = createAdminClient();
    const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.session || !authData.user) {
        throw { message: "Invalid credentials", status: 401 };
    }

    const admin = await getAdminByUserId(authData.user.id);
    if (!admin) {
        throw { message: "Not an authorised admin", status: 403 };
    }

    return {
        user: admin,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
    };
}

/**
 * Verify a bearer token and return the admin profile.
 * Used by withAdminAuth on every protected request.
 * Throws { message, status } on any failure.
 */
export async function getCurrentAdmin(token: string): Promise<AdminProfile> {
    if (!token) {
        throw { message: "Missing auth token", status: 401 };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        throw { message: "Invalid or expired session", status: 401 };
    }

    const admin = await getAdminByUserId(data.user.id);
    if (!admin) {
        throw { message: "Not an authorised admin", status: 403 };
    }

    return admin;
}
