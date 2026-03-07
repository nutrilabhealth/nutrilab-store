import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export function createClient() {
  return window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}
