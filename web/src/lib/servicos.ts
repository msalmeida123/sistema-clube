export type VisaoServicos = 'dia' | 'semana' | 'mes'
export const STATUS_SERVICOS = [
 {id:'a_fazer',nome:'A fazer'}, {id:'em_andamento',nome:'Em andamento'}, {id:'concluido',nome:'Concluído'}
] as const
export type StatusServico = typeof STATUS_SERVICOS[number]['id']
export function hojeServicos(){
 const partes=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date())
 return ['year','month','day'].map(tipo=>partes.find(p=>p.type===tipo)!.value).join('-')
}
export function periodoServicos(data:string,visao:VisaoServicos){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data))throw new Error('Data inválida')
 const inicio=new Date(data+'T12:00:00Z')
 if(Number.isNaN(inicio.getTime())||inicio.toISOString().slice(0,10)!==data)throw new Error('Data inválida')
 const fim=new Date(inicio)
 if(visao==='semana'){
  inicio.setUTCDate(inicio.getUTCDate()-(inicio.getUTCDay()+6)%7)
  fim.setTime(inicio.getTime());fim.setUTCDate(fim.getUTCDate()+6)
 }
 if(visao==='mes'){
  inicio.setUTCDate(1)
  fim.setUTCMonth(fim.getUTCMonth()+1,0)
 }
 return {inicio:inicio.toISOString().slice(0,10),fim:fim.toISOString().slice(0,10)}
}
export function dataServico(data:string){return data.split('-').reverse().join('/')}
