import {NextRequest,NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {verificarPermissao} from '@/lib/usuario-atual'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {z} from 'zod'
export const dynamic='force-dynamic'
const data=z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const schema=z.object({inicio:data,prazo_meses:z.number().int().min(1).max(36),divisor:z.number().positive().max(744),normal:z.number().min(0).max(500),sabado:z.number().min(0).max(500),domingo:z.number().min(0).max(500),feriado:z.number().min(0).max(500),jornada:z.array(z.number().min(0).max(24)).length(7),feriados:z.array(data).max(366)})
export async function GET(){const db=await createRouteHandlerClient({cookies});const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sessão expirada'},{status:401});const p=await verificarPermissao(db,user.id,'rh');if(!p.autorizado)return NextResponse.json({error:'Sem permissão'},{status:403});const {data:config,error}=await db.from('rh_banco_config').select('*').eq('id',true).maybeSingle();return NextResponse.json(error?{error:error.message}:{config,isAdmin:p.isAdmin},{status:error?500:200})}
export async function PUT(req:NextRequest){const auth=await createRouteHandlerClient({cookies});const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:'Sessão expirada'},{status:401});const p=await verificarPermissao(auth,user.id,'rh');if(!p.isAdmin)return NextResponse.json({error:'Somente administrador'},{status:403});try{const b=await req.json();const parametros=schema.parse(b.parametros);const db=servicoAuditado(user.id);const payload={id:true,parametros,updated_at:new Date().toISOString()};const q=b.versao?db.from('rh_banco_config').update(payload).eq('id',true).eq('updated_at',b.versao):db.from('rh_banco_config').insert(payload);const {error}=await q.select('id').single();if(error)throw Error('Configuração alterada. Recarregue antes de salvar.');return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
