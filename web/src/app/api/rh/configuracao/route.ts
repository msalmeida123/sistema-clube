import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {NextRequest,NextResponse} from 'next/server'
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs'
import {createClient} from '@supabase/supabase-js'
import {cookies} from 'next/headers'
import {verificarPermissao} from '@/lib/usuario-atual'
import {validarConfigPonto,testarControlId} from '@/lib/rh-controlid'
export const runtime='nodejs'
export const dynamic='force-dynamic'
async function autorizar(admin=false){
 const auth=createRouteHandlerClient({cookies});const {data:{user}}=await auth.auth.getUser()
 if(!user)return {status:401 as const}
 const p=await verificarPermissao(auth,user.id,'rh')
 if(!p.autorizado||(admin&&!p.isAdmin))return {status:403 as const}
 const db=servicoAuditado(user.id)
 return {status:200 as const,db,isAdmin:p.isAdmin}
}
const erro=(msg:string,status:number)=>NextResponse.json({error:msg},{status,headers:{'Cache-Control':'no-store'}})
export async function GET(){
 const a=await autorizar();if(!a.db)return erro('Acesso restrito ao RH.',a.status)
 const {data,error}=await a.db.from('rh_configuracao').select('*').eq('id',true).single()
 if(error)return erro('Não foi possível carregar a configuração de RH.',500)
 const {senha,...seguro}=data
 return NextResponse.json(a.isAdmin?{...seguro,senha_configurada:!!senha,isAdmin:true}:{empresa_nome:data.empresa_nome,empresa_documento:data.empresa_documento,isAdmin:false},{headers:{'Cache-Control':'no-store'}})
}
export async function PUT(req:NextRequest){
 const a=await autorizar(true);if(!a.db)return erro('Somente administradores podem configurar o aparelho.',a.status)
 let payload
 try{const body=await req.json();payload=validarConfigPonto(body);if(typeof body.senha!=='string'||body.senha.length>200)throw new Error('Senha inválida.');if(body.senha)payload={...payload,senha:body.senha}}catch(e:any){return erro(e.message||'Dados inválidos.',400)}
 const {error}=await a.db.from('rh_configuracao').update(payload).eq('id',true).select('id').single()
 return error?erro('Não foi possível salvar.',500):NextResponse.json({sucesso:true})
}
export async function POST(){
 const a=await autorizar(true);if(!a.db)return erro('Somente administradores podem testar o aparelho.',a.status)
 const {data,error}=await a.db.from('rh_configuracao').select('*').eq('id',true).single()
 if(error)return erro('Não foi possível carregar a configuração.',500)
 try{return NextResponse.json(await testarControlId(data),{headers:{'Cache-Control':'no-store'}})}catch(e:any){return erro(e.message,502)}
}
