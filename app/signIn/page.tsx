'use client'

import { createClient, Session } from '@supabase/supabase-js';
import { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseURL, supabaseAnonKey);

export default function SignInPage() {

    const [session, setSession] = useState<Session | null>(null);

    const [error, submitAction, isPending] = useActionState(
        async (previousState: any, formData: FormData) => {
            // Extract form data
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            console.log('Attempting sign in with email:', email);
            console.log('Password:', password);

            const signInUser = async (email: string, password: string) => {
                try {
                    // Call Supabase sign-in method
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    // Handle known errors (return error)
                    if (error) {
                        return { success: false, data: null, error: error.message };
                    }
                    // Handle success (return data)
                    console.log('Sign in successful:', data);
                    return { success: true, data, error: null };
                } catch (error) {
                    console.error('Unexpected error during sign-in:', error);
                    return { success: false, data: null, error: 'An unexpected error occurred. Please try again.' };
                }
            };
            // Call our sign-in function
            const { success, data, error: signInError } = await signInUser(email, password);
            // Handle known errors (return error)
            if (signInError) {
                return new Error(signInError); // Return error message to the form
            }
            // Handle success (redirect, return null)
            if (success && data?.session) {
                return null;
            }
            // Handle unexpected cases
            return null;
        },
        null // Initial state
    );

    useEffect(() => {
        // Fetch session on component mount
        getInitialSession();
        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            setSession(session);
        });
    }, []);

    async function getInitialSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            // Handle error
            if (error) {
                throw error;
            }
            // Log data
            console.log(data.session);
            setSession(data.session);
        } catch (error) {
            console.error('Error fetching session:', error);
        }
    }

    return session ? (
        <main className="flex-1 bg-white">
            <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Sign In</h1>
                <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Access your account to manage products.</p>
            </section>
            <div style={{ maxWidth: '400px', margin: '40px auto', padding: '0 16px' }}>
                <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    padding: '16px'}}>
                    <p className="text-sm text-gray-700">You are signed in as {session.user.email}.</p>
                    <Link href="/admin" className="block w-full mt-3 text-center hover:underline" style={{color: '#15c4c4'}}>Return to Admin Panel</Link>
                </div>
            </div>
        </main>
    ) : (
        <main className="flex-1 bg-white">
            <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Sign In</h1>
                <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Access your account to manage products.</p>
            </section>
            <div style={{ maxWidth: '400px', margin: '40px auto', padding: '0 16px' }}>
                <div style={{
                    border: '1px solid #e5e7eb',
                    color: '#000000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    padding: '16px'}}>
                    <form className="flex flex-col gap-4" action={submitAction}>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                            aria-required="true"
                            aria-invalid={error ? 'true' : 'false'}
                            aria-describedby={error ? 'signin-error' : undefined}
                            disabled={isPending}    
                        />  
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                            aria-required="true"
                            aria-invalid={error ? 'true' : 'false'}
                            aria-describedby={error ? 'signin-error' : undefined}
                            disabled={isPending}    
                        />
                        <button 
                            type="submit" 
                            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" 
                            aria-busy={isPending}
                        >
                            {isPending ? 'Signing in...' : 'Sign In'}
                        </button>

                        {error && (
                            <div 
                                id="signin-error" 
                                role="alert" 
                                className="text-sm text-red-600"
                            >
                                {error.message}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </main>
    );
}