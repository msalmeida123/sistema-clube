import {ErroPublicoPortal} from './portal-servidor'
import {createHash} from 'node:crypto'
export {hashSenha,confereSenha} from './senhas-associado'
import {NextRequest} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {fetchInterno} from './supabase/fetch-interno'
import {z} from 'zod'
export const COOKIE_ASSOCIADO='clube_associado'
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex')
export const cpfSchema=z.string().transform(s=>s.replace(/\D/g,'')).pipe(z.string().regex(/^\d{11}$/))
export const relatoSchema=z.object({id:z.string().uuid(),assunto:z.string().trim().min(3).max(120),descricao:z.string().trim().min(10).max(5000),local:z.string().trim().min(2).max(200),data_ocorrencia:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s))&&s<=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))})
export function appDb(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:fetchInterno}})}
export async function limite(db:ReturnType<typeof appDb>,key:string,max=10){const {data,error}=await db.rpc('app_associado_limite',{p_chave:digest(key),p_max:max});if(error)throw error;if(data!==true)throw new ErroPublicoPortal('LIMITE',429)}
export function origemValida(req:NextRequest){const origin=req.headers.get('origin');return origin===req.nextUrl.origin||!!process.env.APP_PUBLIC_URL&&origin===new URL(process.env.APP_PUBLIC_URL).origin}
export async function sessaoAssociado(req:NextRequest,allowTemporary=false){
 const token=req.cookies.get(COOKIE_ASSOCIADO)?.value;if(!token)return null;
 const db=appDb(),tokenHash=digest(token);const {data:s,error}=await db.from('associado_app_sessoes').select('associado_id,trocar_senha').eq('token_hash',tokenHash).gt('expira_em',new Date().toISOString()).maybeSingle();
 if(error)throw error;if(!s||s.trocar_senha&&!allowTemporary)return null;
 const {data:a,error:ae}=await db.from('associados').select('id,nome,numero_titulo,status,qr_code,clube_id').eq('id',s.associado_id).maybeSingle();
 if(ae)throw ae;if(!a)return null;return {db,associado:a,sessao:s,tokenHash};
}
