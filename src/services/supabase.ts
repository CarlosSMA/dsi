import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const photoBucket = process.env.EXPO_PUBLIC_SUPABASE_PHOTOS_BUCKET || 'photos';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY antes de enviar fotos.'
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
