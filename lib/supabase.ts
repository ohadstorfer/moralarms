import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Task = {
  id: string;
  user_id: string;
  name: string;
  start_time: string;
  repeat_every_minutes: number;
  timezone: string;
  active: boolean;
  created_at: string;
  notification_text: string | null;
  repeat_weekdays: number[] | null;
};
