import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Use a safer error handling approach that doesn't expose sensitive data
  throw new Error('Missing Supabase configuration. Please check environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    fetch: (input, init) => {
      let token: string | null = null;
      try {
        const url = new URL(window.location.href);
        const tokenFromPath = url.pathname.split('/respond/')[1];
        if (tokenFromPath) {
          token = tokenFromPath;
        }
      } catch (e) {
        // Silently ignore errors
      }

      const headers = new Headers(init?.headers);
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return fetch(input, { ...init, headers });
    },
  },
});
