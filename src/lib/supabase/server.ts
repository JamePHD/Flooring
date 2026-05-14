import { createClient } from "@supabase/supabase-js"; 

export function createServerClient(accessToken?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

    if (!supabaseUrl || !supabaseAnonKey){
        throw new Error ("Missing Supabase environment variables"); 
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false, 
            persistSession: false, 
        }, 
        global: {
            headers: accessToken
            ? {Authorization: `Bearer ${accessToken}` }
            : {}, 
        },
    });
}
