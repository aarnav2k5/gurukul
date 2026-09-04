import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient(url: string, anonKey: string) {
  return createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
