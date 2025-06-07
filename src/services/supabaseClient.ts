import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Use a safer error handling approach that doesn't expose sensitive data
  throw new Error('Missing Supabase configuration. Please check environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
