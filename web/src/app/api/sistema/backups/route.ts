import {stat} from 'node:fs/promises'
import {NextResponse} from 'next/server'
import {adminSistema} from '@/lib/admin-sistema'
export const dynamic='force-dynamic'
export async function GET(){const a=await adminSistema();if(!a.db)return NextResponse.json({error:'Acesso restrito ao administrador'},{status:a.status});const online=await stat('/backups/worker-heartbeat').then(s=>Date.now()-s.mtimeMs<60000).catch(()=>false);const {data,error}=await a.db.from('sistema_backups').select('*').order('criado_em',{ascending:false}).limit(50);return NextResponse.json(error?{error:'Não foi possível consultar backups. Verifique a migração.'}:{backups:data,online},{status:error?500:200,headers:{'Cache-Control':'no-store'}})}
export async function POST(){const a=await adminSistema();if(!a.db)return NextResponse.json({error:'Acesso restrito ao administrador'},{status:a.status});const {data,error}=await a.db.rpc('sistema_pedir_backup');return NextResponse.json(error?{error:'Já existe um backup em andamento ou o serviço ainda não foi configurado.'}:{id:data},{status:error?409:202})}
