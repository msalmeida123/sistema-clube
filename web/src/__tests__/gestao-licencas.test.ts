import {clienteSchema,planoSchema,statusPagamento,periodoAtivo} from '@/lib/gestao-licencas/regras'
const c={id:'ref1',asaas_id:'pay_1',asaas_cliente:'cus_1',valor_centavos:500}
const p={id:'pay_1',customer:'cus_1',externalReference:'licenca:ref1',billingType:'PIX',value:5,status:'RECEIVED'}
test('valida o plano e rejeita centavos fracionários ou preço inferior ao mínimo',()=>{
 expect(planoSchema.safeParse({nome:'Mensal',valor_centavos:500,dias:30}).success).toBe(true)
 for(const valor_centavos of [0,499,500.5,NaN])expect(planoSchema.safeParse({nome:'Mensal',valor_centavos,dias:30}).success).toBe(false)
})
test('domínio é normalizado e não aceita URLs ou caminhos',()=>{
 const cliente={nome:'Clube teste',email:'teste@example.com',documento:'12345678909',plano_id:'11111111-1111-4111-8111-111111111111',instalacao_centavos:500}
 expect(clienteSchema.parse({...cliente,dominio:'CLUBE.EXAMPLE.COM'}).dominio).toBe('clube.example.com')
 expect(clienteSchema.safeParse({...cliente,dominio:'https://evil.test/x'}).success).toBe(false)
})
test.each([{id:'pay_2'},{customer:'cus_2'},{externalReference:'outra'},{billingType:'BOLETO'},{value:4.99},{value:NaN}])('não libera pagamento divergente %j',mudanca=>{expect(()=>statusPagamento({...p,...mudanca},c)).toThrow()})
test('confirmação não é recebimento, estorno parcial também não libera',()=>{
 expect(statusPagamento({...p,status:'CONFIRMED'},c)).toBe('CONFIRMED')
 expect(statusPagamento({...p,refundedValue:1},c)).toBe('PARTIALLY_REFUNDED')
 expect(statusPagamento({...p,deleted:true},c)).toBe('DELETED')
})
test('exige período recebido, iniciado e ainda vigente',()=>{
 const agora=Date.parse('2026-09-20T12:00:00Z')
 const pago={status:'RECEIVED',inicio:'2026-09-20T12:00:00Z',fim:'2026-10-20T12:00:00Z'}
 expect(periodoAtivo([pago],agora)).toEqual(pago)
 for(const status of ['PENDING','CONFIRMED','REFUNDED','DELETED'])expect(periodoAtivo([{...pago,status}],agora)).toBeNull()
 expect(periodoAtivo([{...pago,inicio:'2026-09-21T12:00:00Z'}],agora)).toBeNull()
 expect(periodoAtivo([pago],Date.parse(pago.fim))).toBeNull()
})
