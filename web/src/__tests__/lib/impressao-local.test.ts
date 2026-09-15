import {reciboBalcao,conteudoLocal} from '@/lib/impressao-local'
const config={papel:80,protocolo:'texto',cortar:false}
const pedido={numero_pedido:7,mesa:'5',cliente_nome:'Cliente teste',created_at:'2026-09-09T12:00:00Z',subtotal:15,total:13,desconto:2,bar_itens_pedido:[{produto_nome:'Lanche',quantidade:1,preco_unitario:10,subtotal:10,enviar_cozinha:true},{produto_nome:'Suco',quantidade:1,preco_unitario:5,subtotal:5,enviar_cozinha:false}],bar_pagamentos:[{forma_pagamento:'dinheiro',valor:20,troco:7}]}
test('balcão inclui alimentos, bebidas, total, pagamento, troco e mesa',()=>{
 const t=reciboBalcao(config,pedido).toString();for(const s of ['Lanche','Suco','TOTAL: R$ 13,00','Troco: R$ 7,00','Mesa: 5','NAO FISCAL'])expect(t).toContain(s)
})
test('cozinha envia só os itens de preparo',()=>{
 const t=conteudoLocal(config,pedido,'cozinha').toString();expect(t).toContain('Lanche');expect(t).not.toContain('Suco')
})
test('comandos de texto externo são neutralizados e papel limita a largura',()=>{
 const t=reciboBalcao({...config,papel:58},{...pedido,cliente_nome:'X\u001b@'+ 'a'.repeat(200)}).toString();expect(t).not.toContain('\u001b');expect(t.split('\n').every(l=>l.length<=32)).toBe(true)
})
test('ESC/POS inicializa e corta apenas quando configurado',()=>{
 const b=reciboBalcao({...config,protocolo:'escpos',cortar:true},pedido,true);expect(Array.from(b.subarray(0,2))).toEqual([27,64]);expect(Array.from(b.subarray(-3))).toEqual([29,86,0]);expect(b.toString()).toContain('REIMPRESSAO')
})
