import {NextRequest,NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {appDb,sessaoAssociado} from '@/lib/associado-app'
import {coresSchema,temaPadrao,Tema} from './modelo'
export class ErroTema extends Error {constructor(public status:number,public mensagem:string){super(mensagem);Object.setPrototypeOf(this,ErroTema.prototype)}}
export async function atorTema(){const auth=await createRouteHandlerClient({cookies});const {data:{user},error}=await auth.auth.getUser();if(error||!user)throw new ErroTema(401,'Entre novamente para continuar.');const atual=await buscarUsuarioAtual<any>(auth,user.id,'clube_id,ativo,is_admin');if(!atual?.ativo||!atual.is_admin||!atual.clube_id)throw new ErroTema(403,'Somente administradores do clube podem personalizar o aplicativo.');return {user,clube:atual.clube_id}}
export async function clubeTema(req:NextRequest){
 // Host é associado pelo operador. Não há parâmetro de tenant na API pública.
 const host=(req.headers.get('host')||'').toLowerCase().split(':')[0];
 const db=appDb();const {data:dominio,error}=await db.from('clube_dominios').select('clube_id').eq('dominio',host).maybeSingle();
 if(error)throw error;if(!dominio)throw new ErroTema(404,'Personalização não disponível neste endereço.');
 if(req.cookies.has('clube_associado')){const sessao=await sessaoAssociado(req,true);if(sessao && (sessao.associado as any).clube_id!==dominio.clube_id)throw new ErroTema(403,'Este acesso pertence a outro clube.');}
 else {const auth=await createRouteHandlerClient({cookies});const {data:{user}}=await auth.auth.getUser();if(user){const atual=await buscarUsuarioAtual<any>(auth,user.id,'clube_id,ativo');if(!atual?.ativo||atual.clube_id!==dominio.clube_id)throw new ErroTema(403,'Este acesso pertence a outro clube.');}}
 return dominio.clube_id as string
}
export async function lerTema(clube:string):Promise<Tema>{const {data,error}=await appDb().from('clube_personalizacao').select('cores,versao,tem_icone').eq('clube_id',clube).maybeSingle();if(error)throw error;if(!data)return temaPadrao;return{cores:coresSchema.parse(data.cores),versao:Number(data.versao),icone:!!data.tem_icone,personalizado:true}}
export function erroTema(error:unknown){return NextResponse.json({error:error instanceof ErroTema?error.mensagem:'Não foi possível atualizar a personalização. Tente novamente.'},{status:error instanceof ErroTema?error.status:503,headers:{'Cache-Control':'no-store'}})}
export function origemTema(req:NextRequest){const origin=req.headers.get('origin');let host='';try{host=new URL(origin||'').host.toLowerCase()}catch{}if(!host||host!==(req.headers.get('host')||'').toLowerCase())throw new ErroTema(403,'Reabra a página do sistema e tente novamente.')}
