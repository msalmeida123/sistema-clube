import type { SupabaseClient } from '@supabase/supabase-js'
import { idCarteirinha } from './carteirinha-qr'

// Títulos são identificadores textuais: não remover zeros nem buscar por trecho.
export async function buscarPessoasClube(client: SupabaseClient, entrada: string, incluirDependentes = false): Promise<any[]> {
  const termo = entrada.trim()
  if (!termo || termo.length > 512) return []
  const tabelas = incluirDependentes ? ['associados','dependentes'] : ['associados']
  const ler = async (query: any) => {const {data,error}=await query;if(error) throw error;return data || []}
  const tipar = (rows: any[], tabela: string) => rows.map(p=>({...p,tipo:tabela==='dependentes'?'dependente':'associado'}))
  let exatos: any[]=[]
  for(const tabela of tabelas) exatos.push(...tipar(await ler(client.from(tabela).select('*').eq('qr_code',termo)),tabela))
  if(exatos.length) return exatos
  for(const tabela of tabelas) {
    const id=idCarteirinha(termo,tabela==='dependentes'?'DEP':'SOCIO')
    if(id) return tipar((await ler(client.from(tabela).select('*').eq('id',id))).filter((p:any)=>!p.qr_code?.trim()),tabela)
  }
  if (/^(SOCIO|DEP|CONV)-/i.test(termo)) return []
  const titulares=await ler(client.from('associados').select('*').eq('numero_titulo',termo))
  if(titulares.length) {
    const pessoas=tipar(titulares,'associados')
    if(incluirDependentes) pessoas.push(...tipar(await ler(client.from('dependentes').select('*').in('associado_id',titulares.map((p:any)=>p.id))),'dependentes'))
    return pessoas
  }
  const cpf=termo.replace(/[.\-\s]/g,'')
  for(const tabela of tabelas) {
    let query=client.from(tabela).select('*')
    if(/^\d{11}$/.test(cpf)) query=query.eq('cpf',cpf)
    else if(!/^\d+$/.test(termo)) query=query.ilike('nome','%'+termo.replace(/[%_]/g,'')+'%')
    else continue
    exatos.push(...tipar(await ler(query.limit(20)),tabela))
  }
  return exatos
}
export function correspondeDependente(d: any, entrada: string) {
  const termo=entrada.trim().toLocaleLowerCase('pt-BR')
  if(!termo) return true
  return String(d.associado?.numero_titulo ?? '').toLowerCase()===termo ||
    [d.nome,d.cpf,d.associado?.nome].some(v=>String(v??'').toLocaleLowerCase('pt-BR').includes(termo))
}
