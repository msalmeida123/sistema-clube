import {NextRequest,NextResponse} from 'next/server'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {cookies} from 'next/headers'
import {verificarPermissao} from '@/lib/usuario-atual'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {schemaEncargos} from '@/modules/rh/encargos'
export const dynamic='force-dynamic'
async function acesso(){const auth=await createRouteHandlerClient({cookies});const {data:{user}}=await auth.auth.getUser();if(!user)return null;const p=await verificarPermissao(auth,user.id,'rh');return p.autorizado?{admin:p.isAdmin,db:servicoAuditado(user.id)}:null}
export async function GET(){const a=await acesso();if(!a)return NextResponse.json({error:'Acesso restrito ao RH'},{status:403});const {data,error}=await a.db.from('rh_encargos').select('*').eq('id',true).maybeSingle();return NextResponse.json(error?{error:'Aplique a migração dos encargos de RH'}:{config:data,isAdmin:a.admin},{status:error?500:200,headers:{'Cache-Control':'no-store'}})}
export async function PUT(req:NextRequest){const a=await acesso();if(!a?.admin)return NextResponse.json({error:'Somente administradores podem configurar encargos'},{status:403});try{const body=await req.json();const parametros=schemaEncargos.parse(body.parametros);const payload={id:true,parametros,updated_at:new Date().toISOString()};const q=body.versao?a.db.from('rh_encargos').update(payload).eq('id',true).eq('updated_at',body.versao):a.db.from('rh_encargos').insert(payload);const {error}=await q.select('id').single();return NextResponse.json(error?{error:'Configuração alterada por outra pessoa. Recarregue antes de salvar.'}:{sucesso:true},{status:error?409:200})}catch{return NextResponse.json({error:'Parâmetros inválidos: confira vigência, faixas e valores.'},{status:400})}}
