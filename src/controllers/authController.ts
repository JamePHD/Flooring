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

    const supabase = createAdminClient(); 
    const { data: authData, error: authError } = 
    await supabase.auth.signInWithPassword({ email, password }); 

    if (authError || !authData.session) {
        throw { message: "Invalid credentials", status: 401}; 
    }

    
} 