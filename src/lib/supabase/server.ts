import { createClient } from "@supabase/supabase-js"; 

export function createServerClient(accessToken?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

    if (!supabaseUrl || !supabaseAnnonKey){
        throw new Error ("Missing Supabase environment variables"); 
    }

    return createClient(supabaseUrl, supabaseAnnonKey, {
        auth: {
            autoRefreshToken: false, 
            persistSession: false, 
        }, 
        global: {
            headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        },
    });
}