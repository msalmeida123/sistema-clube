import type {SupabaseClient} from '@supabase/supabase-js'
import {buscarPessoasClube} from './busca-pessoas-clube'
import {idCarteirinha,buscaNumerica} from './carteirinha-qr'
import {DOCUMENTACAO_VAZIA,validarDocumentacao,hojeBrasil} from './documentos-dependente'

export type ConsultaPortaria = {tipo:'leitor'|'cpf'|'nome';valor:string;escolhida?:string}
const resumo = (p:any) => ({id:p.id,nome:p.nome,numero_titulo:p.numero_titulo??null,plano:p.plano??null,foto_url:p.foto_url??null,tipo:p.tipo})
export async function consultarPortariaClube(db:SupabaseClient,consulta:ConsultaPortaria,podeReceber=false) {
 const {tipo,valor,escolhida}=consulta
 const ler=async(query:any)=>{const {data,error}=await query;if(error)throw Error('Não foi possível consultar os dados de acesso.');return data}
 let pessoas:any[]=[]
 if(tipo==='leitor' && buscaNumerica(valor)) pessoas=await buscarPessoasClube(db,valor,true)
 else if(tipo==='leitor') {
  for(const tabela of ['associados','dependentes']) {
   const p=await ler(db.from(tabela).select('*').eq('qr_code',valor).maybeSingle())
   if(p) pessoas.push({...p,tipo:tabela==='dependentes'?'dependente':'associado'})
  }
  if(!pessoas.length) {
   // O aplicativo Android antigo usa UUID puro quando não há QR personalizado.
   const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)?valor:null
   for(const [tabela,prefixo] of [['associados','SOCIO'],['dependentes','DEP']] as const) {
    const id=idCarteirinha(valor,prefixo)||uuid
    if(!id)continue
    const p=await ler(db.from(tabela).select('*').eq('id',id).maybeSingle())
    if(p&&!p.qr_code?.trim())pessoas.push({...p,tipo:tabela==='dependentes'?'dependente':'associado'})
   }
  }
 } else if(tipo==='nome') {
  const termo=valor.replace(/[%_]/g,'').trim()
  if(termo.length<3)throw Error('Digite pelo menos três letras do nome.')
  pessoas=(await ler(db.from('associados').select('*').ilike('nome','%'+termo+'%').limit(20))||[]).map((p:any)=>({...p,tipo:'associado'}))
 } else {
  const cpf=valor.replace(/[.\-\s]/g,'')
  if(!/^\d{11}$/.test(cpf))throw Error('CPF inválido.')
  const p=await ler(db.from('associados').select('*').eq('cpf',cpf).maybeSingle())
  if(p)pessoas=[{...p,tipo:'associado'}]
 }
 if(escolhida)pessoas=pessoas.filter(p=>p.id===escolhida)
 if(pessoas.length>1)return {autorizado:false,opcoes:pessoas.map(resumo)}
 const p=pessoas[0]
 if(!p)return {autorizado:false,motivo:'Pessoa não encontrada no sistema.'}
 let titular=p
 if(p.tipo==='dependente'){
  titular=await ler(db.from('associados').select('id,status,numero_titulo,plano').eq('id',p.associado_id).maybeSingle())
  p.numero_titulo=titular?.numero_titulo??null;p.plano=titular?.plano??null
 }
 const negar=(motivo:string)=>({autorizado:false,motivo,pessoa:resumo(p),tipo:p.tipo})
 if(p.status!=='ativo')return negar('Cadastro inativo. Acesso negado.')
 if(p.tipo==='dependente') {
  const docs=Object.fromEntries(Object.keys(DOCUMENTACAO_VAZIA).map(k=>[k,p[k]??''])) as typeof DOCUMENTACAO_VAZIA
  const pendencia=validarDocumentacao(p.parentesco??'',p.data_nascimento??'',docs,hojeBrasil())
  if(pendencia)return negar(pendencia)
  if(titular?.status!=='ativo')return negar('Titular indisponível ou inativo.')
 }
 const atrasadas=await ler(db.from('mensalidades').select('id,tipo,referencia,mes_referencia,valor,multa,juros,desconto,data_vencimento').eq('associado_id',titular.id).eq('tipo','clube').in('status',['pendente','atrasado']).lt('data_vencimento',hojeBrasil()).order('data_vencimento',{ascending:true}))
 if(atrasadas?.length)return {...negar('Há mensalidade(s) em atraso. Regularize na secretaria para liberar a entrada.'),...(podeReceber&&p.tipo==='associado'?{mensalidadesPendentes:atrasadas}:{})}
 const {error}=await db.from('registros_acesso').insert({portaria:'clube',local:'clube',associado_id:titular.id,dependente_id:p.tipo==='dependente'?p.id:null,pessoa_id:p.id,pessoa_nome:p.nome,tipo_pessoa:p.tipo,tipo:'entrada',metodo:tipo})
 if(error)throw Error('Não foi possível registrar a entrada. Acesso não confirmado.')
 return {autorizado:true,pessoa:resumo(p),tipo:p.tipo}
}
