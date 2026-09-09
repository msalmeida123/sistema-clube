import {createClient} from '@supabase/supabase-js'
/** Somente no servidor, após validar a sessão e a permissão do usuário. */
export function servicoAuditado(usuarioId:string){
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{'x-clube-audit-actor':usuarioId}}})
}
