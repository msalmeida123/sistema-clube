'use client'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {lerCozinhaUSB,salvarCozinhaUSB,padraoUSB} from '@/lib/cozinha-usb'
import {gerarComandaCozinha} from '@/lib/comanda-cozinha'
export default function ConfiguracaoCozinhaUSB(){
 const [config,setConfig]=useState(padraoUSB),[mensagem,setMensagem]=useState('')
 useEffect(()=>{setConfig(lerCozinhaUSB())},[])
 function salvar(){try{salvarCozinhaUSB(config);setMensagem('Preferência USB salva neste computador.')}catch{setMensagem('O navegador não permitiu salvar a preferência.')}}
 function testar(){
  const w=window.open('','_blank');if(!w){setMensagem('Permita abrir a prévia de impressão neste navegador.');return}
  w.opener=null;w.document.open();w.document.write(gerarComandaCozinha({numero_pedido:0,mesa:'TESTE',cliente_nome:config.nome,created_at:new Date().toISOString(),observacao:'TESTE DE IMPRESSÃO USB — NÃO PREPARAR ALIMENTOS',bar_itens_pedido:[{produto_nome:'Teste de impressão da cozinha',quantidade:1,enviar_cozinha:true}]},config.papel));w.document.close()
  setMensagem('Prévia de teste aberta. Clique em Imprimir e selecione a impressora USB. Confira o papel.')
 }
 return <section className="bg-white border rounded-xl p-6 space-y-4">
 <h2 className="text-xl font-semibold">USB neste computador</h2>
 <p>Conecte a impressora por USB e instale o driver no computador. Na janela de impressão, selecione a impressora da cozinha.</p>
 <label className="block">Nome para identificação<Input value={config.nome} maxLength={60} placeholder="Bematech MP-4200 USB" onChange={e=>setConfig({...config,nome:e.target.value})}/></label>
 <label className="block">Papel<select className="block border rounded p-2 w-full" value={config.papel} onChange={e=>setConfig({...config,papel:e.target.value==='58'?58:80})}><option value="80">80 mm</option><option value="58">58 mm</option></select></label>
 <p className="text-sm text-gray-600">Esta preferência vale para este navegador. O nome identifica a configuração; a escolha da impressora acontece na janela de impressão. Use o mesmo tamanho de papel no driver.</p>
 <div className="flex gap-3"><Button onClick={salvar}>Salvar USB</Button><Button variant="outline" onClick={testar}>Teste USB</Button></div>
 <p role="status">{mensagem}</p>
 <p className="text-sm">Nos pedidos, use “Imprimir na USB”. Confira a saída do papel antes de emitir outra via. A impressora de rede continua disponível pelo botão “Enviar pela rede”.</p>
 </section>
}
