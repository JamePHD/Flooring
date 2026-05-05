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

    // Step1: - Validate inputs 
    if (!email || !password){
        throw { message: "Email and password are required", status : 400}; 
    }

    // step 2: sign in with supabase auth 

    const supabase = createAdminClient(); 
    const { data: authData, error: authError } = 
    await supabase.auth.signInWithPassword({ email, password }); 

    if (authError || !authData.session) {
        throw { message: "Invalid credentials", status: 401}; 
    }

    // step 3: verify that the user is an admin 
    const adminProfile = await getAdminByUserId(authData.user.id); 
    
    if (!adminProfile){
        await supabase.auth.signOut(); 
        throw { message: "Unauthorised: not an admin", status : 403}; 
    }

    return {
        user: adminProfile,
        access_token: authData.session.access_token, 
        refresh_token: authData.session.refresh_token, 
    }; 
} 


export async function logoutAdmin(): Promise<void> { 
    const supabase = createAdminClient(); 
    const { error } = await supabase.auth.signOut(); 

    if (error){
        throw { message: "Logout failed", status: 500}; 
    }
}

export async function getCurrentAdmin(
    accessToken: string 
): Promise<AdminProfile> {
    // step 1 - verify token with supabase 
    const supabase = createAdminClient(); 
    const {data: {user}, error} = 
        await supabase.auth.getUser(accessToken); 

    if (error || !user){
        throw { message: "Invalid or expired token", status: 401}; 
    }

    // step 2 - look up admin profile 

    const adminProfile = await getAdminByUserId(user.id); 

    if (!adminProfile){
        throw { message: "Unauthorised: not an admin", status: 403}; 
    }

    return adminProfile; 
}