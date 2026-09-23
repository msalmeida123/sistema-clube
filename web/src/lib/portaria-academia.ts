import type {SupabaseClient} from '@supabase/supabase-js'
import {buscarPessoasClube} from './busca-pessoas-clube'
import {hojeBrasil} from './documentos-dependente'
const resumo=(p:any)=>({id:p.id,nome:p.nome,numero_titulo:p.numero_titulo,foto_url:p.foto_url,qr_code:p.qr_code,status:p.status})
async function ler(q:any){const {data,error}=await q;if(error)throw Error('Não foi possível consultar os dados da academia.');return data}
export async function situacaoAcademia(db:SupabaseClient,id:string,podeReceber=false){
 const hoje=hojeBrasil()
 const assinatura=await ler(db.from('assinaturas_academia').select('id,data_inicio,data_fim,status,plano:planos_academia(nome,horario_acesso)').eq('associado_id',id).eq('status','ativa').order('data_fim',{ascending:false}).limit(1).maybeSingle())
 if(!assinatura)return {assinatura:null,financeiroOk:false,pendencias:[]}
 const contas=await ler(db.from('mensalidades').select('id,tipo,referencia,mes_referencia,valor,multa,juros,desconto,status,data_vencimento,periodo_inicio,periodo_fim').eq('assinatura_academia_id',assinatura.id))
 const financeiroOk=!!contas?.some((m:any)=>m.status==='pago'&&m.periodo_inicio<=hoje&&m.periodo_fim>hoje)&&!contas?.some((m:any)=>['pendente','atrasado'].includes(m.status)&&m.data_vencimento<hoje)
 return {assinatura:{...assinatura,plano:Array.isArray(assinatura.plano)?assinatura.plano[0]:assinatura.plano},financeiroOk,pendencias:podeReceber?(contas||[]).filter((m:any)=>['pendente','atrasado'].includes(m.status)):[]}
}
export async function buscarAcademia(db:SupabaseClient,valor:string,podeReceber=false){
 // Nunca extrair uma carteirinha de leituras emendadas ou de um código corrompido.
 if((valor.match(/SOCIO-|DEP-/gi)||[]).length>1)return {error:'Leituras de QR Code emendadas. Limpe o campo e leia uma única carteirinha.'}
 let pessoas=await buscarPessoasClube(db,valor)
 if(!pessoas.length&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)){
  const p=await ler(db.from('associados').select('id,nome,numero_titulo,foto_url,qr_code,status').eq('id',valor).maybeSingle())
  if(p&&!p.qr_code?.trim())pessoas=[p]
 }
 if(pessoas.length>1)return {opcoes:pessoas.map(resumo)}
 if(!pessoas[0])return {error:'Associado não encontrado. Leia uma única carteirinha ou digite o título.'}
 return {associado:resumo(pessoas[0]),...await situacaoAcademia(db,pessoas[0].id,podeReceber)}
}
export async function registrarAcademia(db:SupabaseClient,id:string,tipo:'entrada'|'saida'){
 const p=await ler(db.from('associados').select('id,status').eq('id',id).maybeSingle())
 if(p?.status!=='ativo')return {error:'Associado inexistente ou inativo.'}
 const {assinatura,financeiroOk}=await situacaoAcademia(db,id)
 const hoje=hojeBrasil()
 if(!assinatura||assinatura.status!=='ativa'||!assinatura.data_inicio||!assinatura.data_fim||assinatura.data_inicio>hoje||assinatura.data_fim<hoje)return {error:'Assinatura da academia inexistente, inativa ou fora da validade.'}
 if(tipo==='entrada'&&!financeiroOk)return {error:'Entrada bloqueada: mensalidade da academia pendente ou sem período pago vigente.'}
 const {error}=await db.from('acessos_academia').insert({associado_id:id,assinatura_id:assinatura.id,tipo})
 if(error)throw Error('Não foi possível registrar o acesso.')
 return {ok:true}
}
export async function historicoAcademia(db:SupabaseClient,pagina=1,limite=20){
 const inicio=new Date(hojeBrasil()+'T00:00:00-03:00');const fim=new Date(inicio.getTime()+86400000)
 const {data,count,error}=await db.from('acessos_academia').select('id,data_hora,tipo,associado:associados(nome,numero_titulo)',{count:'exact'}).gte('data_hora',inicio.toISOString()).lt('data_hora',fim.toISOString()).order('data_hora',{ascending:false}).order('id',{ascending:false}).range((pagina-1)*limite,pagina*limite-1)
 if(error)throw Error('Não foi possível carregar o histórico da academia.')
 return {acessos:(data||[]).map((a:any)=>({...a,associado:Array.isArray(a.associado)?a.associado[0]:a.associado})),total:count||0,pagina,limite,temMais:pagina*limite<(count||0)}
}
