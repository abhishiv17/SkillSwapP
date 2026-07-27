import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Cookie-based browser client via @supabase/ssr.
// Uses PKCE flow so OAuth returns a ?code= query param (server-readable)
// instead of a #access_token= hash fragment (invisible to server).

let browserClient: SupabaseClient | null = null;

export const createClient = () => {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
        },
      }
    );
  }

  // On the browser, use a singleton to prevent multiple instances competing
  // for the session lock (avoids "Lock broken by another request" errors)
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
        },
      }
    );
  }

  return browserClient;
};
