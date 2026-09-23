import {tokenAsaasValido,conferirPagamentoSandbox} from '../lib/asaas-sandbox'
const c={id:'pay_teste',cliente:'cus_teste',referencia:'teste-academia',valor:'120.00'}
const p={id:c.id,customer:c.cliente,externalReference:c.referencia,value:120,billingType:'PIX',status:'RECEIVED'}
test('token válido e inválido',()=>{expect(tokenAsaasValido('a'.repeat(48),'a'.repeat(48))).toBe(true);expect(tokenAsaasValido('','a'.repeat(48))).toBe(false);expect(tokenAsaasValido('b'.repeat(48),'a'.repeat(48))).toBe(false)})
test('confere a cobrança da conta sandbox',()=>expect(conferirPagamentoSandbox(p,c)).toBe('RECEIVED'))
test.each([{id:'pay_outro'},{customer:'cus_outro'},{externalReference:'outra'},{value:1},{billingType:'CREDIT_CARD'},{status:'INVENTADO'}])('recusa divergências %j',alteracao=>expect(()=>conferirPagamentoSandbox({...p,...alteracao},c)).toThrow())
test('não transforma pendente ou estornado em pago',()=>{expect(conferirPagamentoSandbox({...p,status:'PENDING'},c)).toBe('PENDING');expect(conferirPagamentoSandbox({...p,status:'REFUNDED'},c)).toBe('REFUNDED')})
