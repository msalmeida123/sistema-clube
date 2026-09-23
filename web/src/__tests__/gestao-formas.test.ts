import {statusPagamento,linkCartaoSeguro,depositoSchema} from '@/lib/gestao-licencas/regras'
const c={id:'ref',asaas_id:'pay_1',asaas_cliente:'cus_1',valor_centavos:9900,forma:'CREDIT_CARD'}
const pago={id:'pay_1',customer:'cus_1',externalReference:'licenca:ref',value:99,billingType:'CREDIT_CARD',status:'CONFIRMED'}
test('cartão confirmado libera antes do repasse, Pix em revisão não libera',()=>{
 expect(statusPagamento(pago,c)).toBe('RECEIVED')
 expect(statusPagamento({...pago,billingType:'PIX'},{...c,forma:'PIX'})).toBe('CONFIRMED')
 expect(statusPagamento({...pago,billingType:'DEBIT_CARD'},c)).toBe('RECEIVED')
})
test.each(['AUTHORIZED','AWAITING_RISK_ANALYSIS'])('%s não libera cartão',status=>expect(statusPagamento({...pago,status},c)).toBe('PENDING'))
test.each(['CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL'])('%s revoga a liberação',status=>expect(statusPagamento({...pago,status},c)).toBe('REFUND_IN_PROGRESS'))
test('estorno parcial revoga cartão já confirmado',()=>expect(statusPagamento({...pago,refundedValue:10},c)).toBe('PARTIALLY_REFUNDED'))
test('não confunde cartão, Pix ou recebimento manual',()=>{
 expect(()=>statusPagamento(pago,{...c,forma:'PIX'})).toThrow()
 expect(()=>statusPagamento({...pago,billingType:'PIX'},c)).toThrow()
 expect(()=>statusPagamento(pago,{...c,forma:'DEPOSITO'})).toThrow()
})
test('link do cartão pertence ao Asaas e ao ambiente correto',()=>{
 expect(linkCartaoSeguro('https://sandbox.asaas.com/i/teste','sandbox')).toContain('/i/teste')
 expect(linkCartaoSeguro('https://www.asaas.com/i/teste','production')).toContain('/i/teste')
 for(const url of ['https://evil.test/i/1','javascript:alert(1)','https://www.asaas.com/i/1','http://sandbox.asaas.com/i/1','https://sandbox.asaas.com.evil.test/i/1'])expect(()=>linkCartaoSeguro(url,'sandbox')).toThrow()
})
test('confirmação manual exige conferência, data válida e referência',()=>{
 const d={conferido:true,valor_centavos:9900,referencia:'Extrato transação 123',data:'2026-01-01'}
 expect(depositoSchema.safeParse(d).success).toBe(true)
 for(const diff of [{conferido:false},{data:'2099-01-01'},{data:'2026-02-31'},{referencia:''},{valor_centavos:12.34}])expect(depositoSchema.safeParse({...d,...diff}).success).toBe(false)
})
