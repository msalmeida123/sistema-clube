jest.mock('@/lib/supabase/acesso-rota',()=>({acessoRota:jest.fn()}))
jest.mock('@/lib/associado-app',()=>({appDb:jest.fn()}))
import {emitirCobranca} from '@/lib/gestao-licencas/servidor'
import {clienteSchema} from '@/lib/gestao-licencas/regras'
const cfg:any={ambiente:'sandbox',apiKey:'teste'}
const cliente={id:'cliente',ambiente:'sandbox',instalacao_centavos:9900,plano_id:'plano',bloqueado:false,asaas_cliente:'cus_1'}
const plano={nome:'Anual',valor_centavos:50000,dias:365}
function banco(resultados:any[]){
 const consultas:any[]=[]
 const db:any={from:jest.fn(()=>{
  const resposta=resultados.shift()
  const q:any={then:(ok:any,no:any)=>Promise.resolve(resposta).then(ok,no)}
  for(const nome of ['select','eq','not','in','insert','update','maybeSingle','single'])q[nome]=jest.fn(()=>q)
  consultas.push(q);return q
 }),rpc:jest.fn().mockResolvedValue({error:null})}
 return {db,consultas}
}
beforeEach(()=>{jest.restoreAllMocks()})
test('emissão por depósito fica pendente e não chama o Asaas nem concede dias',async()=>{
 const cobranca={id:'pedido',tipo:'instalacao',forma:'DEPOSITO',status:'PENDING'}
 const {db,consultas}=banco([{data:cliente},{data:[]},{data:plano},{data:cobranca}])
 const fetcher=jest.spyOn(global,'fetch')
 expect(await emitirCobranca(db,cfg,'cliente','pedido','instalacao','DEPOSITO','Banco de teste — conta fictícia')).toBe('pedido')
 expect(consultas[3].insert).toHaveBeenCalledWith(expect.objectContaining({forma:'DEPOSITO',status:'PENDING',dias:30}))
 expect(fetcher).not.toHaveBeenCalled();expect(db.rpc).not.toHaveBeenCalled()
})
test('não reutiliza uma cobrança Pix como depósito manual',async()=>{
 const {db}=banco([{data:cliente},{data:[]},{data:plano},{data:{id:'pedido',tipo:'instalacao',forma:'PIX'}}])
 await expect(emitirCobranca(db,cfg,'cliente','pedido','instalacao','DEPOSITO','Banco de teste — conta fictícia')).rejects.toMatchObject({status:409})
 expect(db.rpc).not.toHaveBeenCalled()
})
test('mensalidade não substitui o pagamento inicial da instalação',async()=>{
 const {db}=banco([{data:cliente},{data:[]}])
 await expect(emitirCobranca(db,cfg,'cliente','pedido','mensalidade')).rejects.toMatchObject({status:409})
 expect(db.from).toHaveBeenCalledTimes(2)
})
test('instalação já paga não é cobrada de novo nem ganha outro período',async()=>{
 const {db}=banco([{data:cliente},{data:[{id:'inst-paga',status:'RECEIVED'}]}])
 expect(await emitirCobranca(db,cfg,'cliente','outro-pedido','instalacao')).toBe('inst-paga')
 expect(db.rpc).not.toHaveBeenCalled()
})
test.each(['instalacao','mensalidade'] as const)('%s congela seu preço e período, sem somar as duas cobranças',async tipo=>{
 const c={id:'pedido',cliente_id:'cliente',tipo,ambiente:'sandbox',asaas_id:'pay_1',asaas_cliente:'cus_1',valor_centavos:tipo==='instalacao'?9900:50000}
 const {db,consultas}=banco([{data:cliente},{data:tipo==='mensalidade'?[{id:'inst',status:'RECEIVED'}]:[]},{data:plano},{data:c}])
 const fetchMock=jest.spyOn(global,'fetch').mockResolvedValue(Response.json({id:'pay_1',customer:'cus_1',externalReference:'licenca:pedido',billingType:'PIX',value:c.valor_centavos/100,status:'RECEIVED'}))
 await emitirCobranca(db,cfg,'cliente','pedido',tipo)
 expect(consultas[3].insert).toHaveBeenCalledWith(expect.objectContaining({tipo,valor_centavos:tipo==='instalacao'?9900:50000,dias:tipo==='instalacao'?30:365}))
 expect(fetchMock).toHaveBeenCalledTimes(1)
 expect(db.rpc).toHaveBeenCalledWith('gestao_confirmar_pagamento',expect.objectContaining({p_status:'RECEIVED'}))
})
test('novo contrato exige valor de instalação válido',()=>{
 const c={nome:'Clube teste',email:'clube@example.com',documento:'12345678909',dominio:'clube.example.com',plano_id:'11111111-1111-4111-8111-111111111111'}
 for(const valor of [undefined,0,499,500.5])expect(clienteSchema.safeParse({...c,instalacao_centavos:valor}).success).toBe(false)
 expect(clienteSchema.safeParse({...c,instalacao_centavos:9900}).success).toBe(true)
})
