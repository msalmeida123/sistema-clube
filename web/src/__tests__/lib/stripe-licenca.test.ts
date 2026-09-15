import {createHmac} from 'node:crypto'
import {verificarAssinaturaStripe,confirmarFaturaStripe} from '@/lib/stripe-licenca'
const originalFetch=global.fetch
const licenseId='10000000-0000-4000-8000-000000000001'
const invoice={id:'in_teste',status:'paid',paid:true,subscription:'sub_teste',customer:'cus_teste',lines:{data:[{type:'subscription',subscription:'sub_teste',price:{id:'price_teste'},period:{end:1790827200}}]}}
const sub={id:'sub_teste',customer:'cus_teste',metadata:{license_id:licenseId}}
const config={stripe_secret:'sk_test_ficticia',stripe_price:'price_teste'}
afterEach(()=>{global.fetch=originalFetch})
test('valida assinatura sobre bytes originais e rejeita alteração/expiração',()=>{const raw='{"type":"invoice.paid"}',t='1790000000',secret='whsec_ficticio';const hash=createHmac('sha256',secret).update(t+'.'+raw).digest('hex');expect(verificarAssinaturaStripe(raw,'t='+t+',v1='+hash,secret,Number(t)*1000).type).toBe('invoice.paid');expect(()=>verificarAssinaturaStripe(raw+' ','t='+t+',v1='+hash,secret,Number(t)*1000)).toThrow();expect(()=>verificarAssinaturaStripe(raw,'t='+t+',v1='+hash,secret,(Number(t)+301)*1000)).toThrow()})
function mockDB(l:any={id:licenseId,stripe_customer_id:'cus_teste',stripe_subscription_id:'sub_teste'}){const q:any={select:()=>q,eq:()=>q,single:async()=>({data:l,error:null})};return {from:()=>q,rpc:jest.fn().mockResolvedValue({data:true,error:null})}}
function respostas(...valores:any[]){global.fetch=jest.fn();for(const v of valores)(global.fetch as jest.Mock).mockResolvedValueOnce({ok:true,json:async()=>v})}
test('fatura paga e preço correto renovam por RPC confiável',async()=>{respostas(invoice,sub);const db=mockDB();expect((await confirmarFaturaStripe(db,config,'in_teste')).renovada).toBe(true);expect(db.rpc).toHaveBeenCalledWith('licenca_confirmar_pagamento_stripe',expect.objectContaining({p_evento:'stripe:in_teste',p_license_id:licenseId,p_subscription:'sub_teste',p_customer:'cus_teste'}))})
test('fatura aberta nunca renova',async()=>{respostas({...invoice,status:'open',paid:false});const db=mockDB();expect((await confirmarFaturaStripe(db,config,'in_teste')).renovada).toBe(false);expect(db.rpc).not.toHaveBeenCalled()})
test('preço errado não concede licença',async()=>{respostas(invoice,sub);const db=mockDB();expect((await confirmarFaturaStripe(db,{...config,stripe_price:'price_outro'},'in_teste')).renovada).toBe(false);expect(db.rpc).not.toHaveBeenCalled()})
test('cliente e assinatura divergentes são rejeitados',async()=>{respostas(invoice,sub);const db=mockDB({id:licenseId,stripe_customer_id:'cus_outro'});await expect(confirmarFaturaStripe(db,config,'in_teste')).rejects.toThrow('Cliente');expect(db.rpc).not.toHaveBeenCalled()})
