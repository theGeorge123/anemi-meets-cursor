import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  // Use a safer error handling approach that doesn't expose sensitive data
  throw new Error('Missing Supabase config');
}

const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  r = 3,
  b = 300,
): Promise<Response> => {
  try {
    return await fetch(input, init);
  } catch (e) {
    if (!r) throw e;
    await new Promise((res) => setTimeout(res, b));
    return fetchWithRetry(input, init, r - 1, b * 2);
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: { fetch: fetchWithRetry },
});
