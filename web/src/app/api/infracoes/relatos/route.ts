import {NextRequest,NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {z} from 'zod'
export const dynamic='force-dynamic'
export async function GET(){const a=await acessoRota('infracoes');if(!a)return NextResponse.json({error:'Sem permissão'},{status:403});const {data,error}=await servicoAuditado(a.user.id).from('associado_app_relatos').select('*,associado:associados(nome,numero_titulo)').order('criado_em',{ascending:false}).limit(200);return NextResponse.json(error?{error:'Falha ao carregar relatos'}:{relatos:data},{status:error?500:200,headers:{'Cache-Control':'no-store'}})}
export async function PUT(req:NextRequest){const a=await acessoRota('infracoes','editar');if(!a)return NextResponse.json({error:'Sem permissão'},{status:403});try{const b=z.object({id:z.string().uuid(),status:z.enum(['recebido','em_analise','respondido','encerrado']),resposta:z.string().trim().min(3).max(5000)}).parse(await req.json());const {error}=await servicoAuditado(a.user.id).from('associado_app_relatos').update({status:b.status,resposta:b.resposta,respondido_por:a.user.id,atualizado_em:new Date().toISOString()}).eq('id',b.id).select('id').single();if(error)throw error;return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'Informe uma resposta válida.'},{status:400})}}
