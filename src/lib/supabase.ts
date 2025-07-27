import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Reminder = {
  id: string
  user_id: string
  title: string
  message: string
  reminder_date: string
  category: string
  contact_methods: string[]
  persistence: string
  repeat_settings?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    until_complete: boolean
  }
  completed: boolean
  contact_email?: string
  contact_phone?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type UserSettings = {
  id: string
  user_id: string
  email: string
  phone?: string
  default_reminder_time: string
  default_contact_methods?: string[]
  created_at: string
  updated_at: string
} 

export type UserTheme = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  created_at: string;
  updated_at: string;
}; 