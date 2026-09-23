import type {SupabaseClient} from '@supabase/supabase-js'
import {buscarPessoasClube} from './busca-pessoas-clube'
import {hojeBrasil} from './documentos-dependente'
const campos='id,nome,numero_titulo,foto_url,qr_code,status'
const resumo=(p:any)=>({id:p.id,nome:p.nome,numero_titulo:p.numero_titulo,foto_url:p.foto_url,qr_code:p.qr_code,status:p.status})
async function ler(query:any){const {data,error}=await query;if(error)throw Error('Falha ao consultar dados da piscina.');return data}
export async function examePiscina(db:SupabaseClient,id:string){
 return ler(db.from('exames_medicos').select('id,data_validade,resultado').eq('associado_id',id).is('dependente_id',null).eq('tipo_exame','piscina').eq('resultado','apto').lte('data_exame',hojeBrasil()).gte('data_validade',hojeBrasil()).order('data_validade',{ascending:false}).limit(1).maybeSingle())
}
export async function buscarPiscina(db:SupabaseClient,valor:string){
 let pessoas=await buscarPessoasClube(db,valor)
 if(!pessoas.length && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)){
  const p=await ler(db.from('associados').select(campos).eq('id',valor).maybeSingle())
  if(p&&!p.qr_code?.trim())pessoas=[p]
 }
 if(pessoas.length>1)return {opcoes:pessoas.map(resumo)}
 const p=pessoas[0]
 if(!p)return {error:'Associado não encontrado.'}
 return {associado:resumo(p),exame:await examePiscina(db,p.id)}
}
export async function registrarPiscina(db:SupabaseClient,id:string,tipo:'entrada'|'saida'){
 const p=await ler(db.from('associados').select('id,status').eq('id',id).maybeSingle())
 if(!p)return {error:'Associado não encontrado.'}
 if(p.status!=='ativo')return {error:'Associado inativo. Acesso negado.'}
 // Reconsultar no momento do registro: nunca confiar no exame exibido pelo navegador.
 const exame=await examePiscina(db,id)
 if(tipo==='entrada'&&!exame)return {error:'Entrada bloqueada: exame da piscina vencido, inexistente ou sem aptidão.'}
 const {error}=await db.from('acessos_piscina').insert({associado_id:id,tipo,exame_valido:Boolean(exame)})
 if(error)throw Error('Não foi possível registrar o acesso.')
 return {ok:true}
}
export async function historicoPiscina(db:SupabaseClient,pagina=1,limite=20){
 const hoje=hojeBrasil();const inicio=new Date(hoje+'T00:00:00-03:00');const fim=new Date(inicio.getTime()+86400000)
 const {data,count,error}=await db.from('acessos_piscina').select('id,data_hora,tipo,exame_valido,associado:associados(nome,numero_titulo)',{count:'exact'}).gte('data_hora',inicio.toISOString()).lt('data_hora',fim.toISOString()).order('data_hora',{ascending:false}).order('id',{ascending:false}).range((pagina-1)*limite,pagina*limite-1)
 if(error)throw Error('Não foi possível carregar os acessos de hoje.')
 return {acessos:(data||[]).map((a:any)=>({...a,associado:Array.isArray(a.associado)?a.associado[0]:a.associado})),total:count||0,pagina,limite,temMais:pagina*limite<(count||0)}
}
