import {listarConvitesFinanceiro,convitesFinanceiroMes} from '@/lib/financeiro-convites'

function banco(linhas:any[],error:any=null) {
 const filtros:Array<(r:any)=>boolean>=[]
 const q:any={
  select:(campos:string)=>{if(/data_validade|convidado_nome/.test(campos))throw Error('Coluna inexistente');return q},
  in:(k:string,v:string[])=>{filtros.push(r=>v.includes(r[k]));return q},
  gte:(k:string,v:string)=>{filtros.push(r=>r[k]>=v);return q},
  lte:(k:string,v:string)=>{filtros.push(r=>r[k]<=v);return q},
  order:(k:string)=>{if(k!=='data_visita')throw Error('Coluna inexistente');return q},
  limit:()=>q,
  then:(resolve:any)=>Promise.resolve({data:linhas.filter(r=>filtros.every(f=>f(r))),error}).then(resolve)
 }
 return {from:()=>q}
}
const dados=[
 {nome_convidado:'Ana',status:'pago',data_visita:'2026-09-10',valor_pago:30},
 {nome_convidado:'Bia',status:'utilizado',data_visita:'2026-09-11',valor_pago:30},
 {nome_convidado:'Caio',status:'ativo',data_visita:'2026-09-12',valor_pago:0},
 {nome_convidado:'Cancelado',status:'cancelado',data_visita:'2026-09-12',valor_pago:30},
 {nome_convidado:'Outro mês',status:'pago',data_visita:'2026-08-10',valor_pago:30}
]
test('lista convidados pagos, utilizados e ativos com seus nomes reais',async()=>{
 const rows=await listarConvitesFinanceiro(banco(dados))
 expect(rows.map((r:any)=>r.nome_convidado)).toEqual(['Ana','Bia','Caio','Outro mês'])
})
test('resumo considera a data da visita e não soma convites cancelados',async()=>{
 const rows=await convitesFinanceiroMes(banco(dados),'2026-09-01','2026-09-30')
 expect(rows).toHaveLength(3)
 expect(rows.reduce((sum:number,r:any)=>sum+r.valor_pago,0)).toBe(60)
})
test('falha na listagem não é confundida com lista vazia',async()=>{
 await expect(listarConvitesFinanceiro(banco([],Error('falha')))).rejects.toThrow('falha')
})
test('falha no resumo não é confundida com receita zero',async()=>{
 await expect(convitesFinanceiroMes(banco([],Error('falha')),'2026-09-01','2026-09-30')).rejects.toThrow('falha')
})
