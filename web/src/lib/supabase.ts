import { createClientComponentClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

export const supabase = createClientComponentClient<Database>()
