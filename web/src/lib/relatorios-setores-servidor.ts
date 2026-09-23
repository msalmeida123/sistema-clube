/** Consultas fixas: o cliente escolhe o setor, nunca tabela, SELECT ou clube. */
export const setoresRelatorio = ['piscina','portaria','academia','sauna','convites','associados'] as const
export async function lerRegistrosRelatorio(db:any,tabela:string,select:string,filtro:string,clube:string,campoData?:string,inicio?:string,fim?:string){
 const linhas:any[]=[]
 for(let offset=0;;offset+=500){
  let q=db.from(tabela).select(select).eq(filtro,clube).order('id').range(offset,offset+499)
  if(campoData)q=q.gte(campoData,inicio).lte(campoData,fim)
  const {data,error}=await q;if(error)throw error
  linhas.push(...(data||[]));if(!data||data.length<500)break
 }
 return linhas
}
export async function dadosSetor(db:any,clube:string,setor:string,inicio:string,fim:string){
 const ler=(t:string,s:string,f:string,d?:string)=>lerRegistrosRelatorio(db,t,s,f,clube,d,inicio,fim)
 if(setor==='associados')return {associados:(await ler('associados','*','clube_id')).map(a=>({...a,plano:{tipo:a.plano,nome:({individual:'Individual',familiar:'Familiar',patrimonial:'Patrimonial'} as Record<string,string>)[a.plano]||a.plano}})),dependentes:await ler('dependentes','*,associado:associados!inner(nome,clube_id)','associado.clube_id')}
 const mapa:Record<string,[string,string]>={piscina:['acessos_piscina','data_hora'],portaria:['registros_acesso','data_hora'],academia:['acessos_academia','data_hora'],sauna:['uso_armarios_sauna','data_entrada'],convites:['convites','created_at']}
 const [tabela,data]=mapa[setor]||[];if(!tabela)throw Error('Setor inválido')
 const extra=(setor==='sauna'?',armario:armarios_sauna(numero)':'')+(['portaria','sauna'].includes(setor)?',dependente:dependentes(nome,cpf)':'')
 const registros=(await ler(tabela,'*,associado:associados(nome,numero_titulo,cpf)'+extra,'clube_id',data)).sort((a,b)=>String(b[data]).localeCompare(String(a[data])))
 return setor==='sauna'?{usos:registros,multas:await ler('multas_sauna','*,associado:associados(nome)','clube_id','created_at')}:{[setor==='convites'?'convites':'acessos']:registros}
}
