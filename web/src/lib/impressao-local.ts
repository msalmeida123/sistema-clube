import {createClient} from '@supabase/supabase-js'
import {textoImpressora,bytesComanda} from './impressora-rede'
export function bancoImpressao(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})}
export function reciboBalcao(config:any,pedido:any,reimpressao=false):Buffer {
 const cols=config.papel===58?32:48
 const moeda=(v:any)=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
 const linhas=['BALCAO - COMPROVANTE DE VENDA',reimpressao?'*** REIMPRESSAO ***':'',`Pedido #${pedido.numero_pedido}`,`Mesa: ${pedido.mesa||'Balcao'}`,`Cliente: ${pedido.cliente_nome||pedido.associado_nome||'Consumidor final'}`,new Date(pedido.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),'-'.repeat(cols)]
 for(const i of pedido.bar_itens_pedido||[])linhas.push(`${Number(i.quantidade)}x ${String(i.produto_nome).slice(0,200)}`,`Unit. R$ ${moeda(i.preco_unitario)}  R$ ${moeda(i.subtotal)}`)
 linhas.push('-'.repeat(cols),`Subtotal: R$ ${moeda(pedido.subtotal)}`,`Desconto: R$ ${moeda(pedido.desconto)}`,`TOTAL: R$ ${moeda(pedido.total)}`)
 for(const p of pedido.bar_pagamentos||[]){linhas.push(`${p.forma_pagamento}: R$ ${moeda(p.valor)}`);if(p.troco>0)linhas.push(`Troco: R$ ${moeda(p.troco)}`)}
 if(pedido.observacao)linhas.push(`Obs: ${String(pedido.observacao).slice(0,500)}`)
 linhas.push('COMPROVANTE NAO FISCAL','Obrigado pela preferencia!')
 const text=linhas.flatMap(l=>textoImpressora(l).match(new RegExp(`.{1,${cols}}`,'g'))||['']).join('\n')+'\n\n\n\n'
 return Buffer.concat([config.protocolo==='escpos'?Buffer.from([27,64]):Buffer.alloc(0),Buffer.from(text,'ascii'),config.protocolo==='escpos'&&config.cortar?Buffer.from([29,86,0]):Buffer.alloc(0)])
}
export function conteudoLocal(config:any,pedido:any,destino:string,reimpressao=false){
 return destino==='balcao'?reciboBalcao(config,pedido,reimpressao):bytesComanda({nome:'Cozinha',ip:'',porta:9100,colunas:config.papel===58?32:48,protocolo:config.protocolo,cortar:config.cortar,ativo:true},pedido,reimpressao)
}
