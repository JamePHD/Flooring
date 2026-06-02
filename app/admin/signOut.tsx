'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseURL, supabaseAnonKey);

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/signIn');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      style={{ 
        padding: '10px 20px', 
        background: '#0d5a57', 
        border: 'none', 
        color: 'white', 
        borderRadius: '6px', 
        fontWeight: 'bold', 
        cursor: 'pointer' 
      }}
    >
      Sign Out
    </button>
  );
}