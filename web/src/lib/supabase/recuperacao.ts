import {createClient} from '@supabase/supabase-js'
import {BrowserCookieAuthStorageAdapter} from '@supabase/auth-helpers-shared'
import {sessionLock} from './session-lock'
// O link só é consumido após confirmar a nova senha, não ao abrir a página.
export function criarClienteRecuperacao(){
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
  auth:{flowType:'pkce',detectSessionInUrl:false,persistSession:true,autoRefreshToken:false,storage:new BrowserCookieAuthStorageAdapter(),lock:sessionLock}
 })
}
