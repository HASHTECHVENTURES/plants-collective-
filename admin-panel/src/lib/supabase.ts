import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vwdrevguebayhyjfurag.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZHJldmd1ZWJheWh5amZ1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NDI1MzAsImV4cCI6MjA0OTQxODUzMH0.LLbSjiM-RCbMCQN_p8xNOqjkZLVpKnpsMtvjCpuXXm0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface AdminUser {
  id: string
  email: string
  password_hash: string
  name: string | null
  role: 'super_admin' | 'admin' | 'editor'
  avatar_url: string | null
  last_login: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  phone_number: string | null
  country_code: string | null
  full_name: string | null
  gender: string | null
  birthdate: string | null
  country: string | null
  state: string | null
  city: string | null
  avatar_url: string | null
  pin: string | null
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  featured_image: string | null
  external_link: string | null // Link to external blog post
  category: string | null
  tags: string[] | null
  author_id: string | null
  author_name: string | null
  is_published: boolean
  published_at: string | null
  views: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  image_url: string | null
  video_url: string | null
  media_type: 'image' | 'video'
  product_link: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'promo' | 'alert' | 'update'
  link: string | null
  target: string
  target_filter: any | null
  is_active: boolean
  scheduled_at: string | null
  sent_at: string | null
  created_by: string | null
  created_at: string
}

export interface AppConfig {
  id: string
  key: string
  value: any
  description: string | null
  updated_by: string | null
  updated_at: string
}

export interface KnowledgeDocument {
  id: string
  name: string
  description: string | null
  category: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  content: string | null
  status: 'processing' | 'ready' | 'error'
  error_message: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

