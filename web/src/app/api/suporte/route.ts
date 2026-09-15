import {NextRequest,NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {suporteSchema} from '@/lib/suporte-config'
export const dynamic='force-dynamic'
async function acesso(){const a=await acessoRota();return a?{db:servicoAuditado(a.user.id),admin:a.admin}:null}
export async function GET(){const a=await acesso();if(!a)return NextResponse.json({error:'Acesso restrito a usuários ativos'},{status:403});const {data,error}=await a.db.from('sistema_suporte').select('dados,updated_at').eq('id',true).maybeSingle();return NextResponse.json(error?{error:'Não foi possível carregar o suporte'}:{config:data?.dados||null,versao:data?.updated_at||null,admin:a.admin},{status:error?500:200,headers:{'Cache-Control':'no-store'}})}
export async function PUT(req:NextRequest){const a=await acesso();if(!a?.admin)return NextResponse.json({error:'Somente administrador pode configurar o suporte'},{status:403});try{const b=await req.json();const dados=suporteSchema.parse(b.config);const payload={id:true,dados,updated_at:new Date().toISOString()};const q=b.versao?a.db.from('sistema_suporte').update(payload).eq('id',true).eq('updated_at',b.versao):a.db.from('sistema_suporte').insert(payload);const {error}=await q.select('id').single();if(error)throw Error('Configuração alterada. Recarregue antes de salvar.');return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
