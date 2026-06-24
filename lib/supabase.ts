import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          location: string | null
          date: string
          image_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['memories']['Insert']>
      }
      messages: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          mood: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      occasions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          type: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['occasions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['occasions']['Insert']>
      }
    }
  }
}
