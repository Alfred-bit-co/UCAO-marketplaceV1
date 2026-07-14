import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser client for client-side data fetching and auth.
 *
 * TODO: Once your Supabase project is created, add these to frontend/.env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *
 * The client will throw at runtime if env vars are missing once Supabase
 * integration is activated. Until then, data functions fall back to demo data.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // TODO: Remove this placeholder once Supabase keys are configured.
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
