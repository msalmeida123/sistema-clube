import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkwwmigflhyntdwyqpip.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd3dtaWdmbGh5bnRkd3lxcGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDM2NzYsImV4cCI6MjA1MDQ3OTY3Nn0.t3meGz_cT4TzjGMpXr_5DZpVm9gSjPw1fk-eR5Z2oo4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
