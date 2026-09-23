'use client'
import {BotaoImpressao} from '@/components/BotaoImpressao'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {abrirDocumento} from '@/lib/impressao-documento'
import {CHAVE_IMPRESSORA_RH,lerImpressaoRH,estiloImpressaoRH} from '../impressora'
import {toast} from 'sonner'

export function ConfiguracaoImpressoraRH(){
 const [margem,setMargem]=useState(16)
 const [alterado,setAlterado]=useState(false)
 const [rede,setRede]=useState<{nome:string;ip:string;porta:number;updated_at:string}|null>(null)
 const [erroRede,setErroRede]=useState(''),[ocupado,setOcupado]=useState(false),[redeAlterada,setRedeAlterada]=useState(false),[resultado,setResultado]=useState('')
 async function carregarRede(){
  setErroRede('')
  try{const r=await fetch('/api/rh/impressora');const d=await r.json();if(!r.ok)throw Error(d.error);setRede(d);setRedeAlterada(false);setResultado('')}
  catch(e:any){setErroRede(e.message)}
 }
 useEffect(()=>{void carregarRede()},[])
 async function salvarRede(e:React.FormEvent){
  e.preventDefault();setOcupado(true);setResultado('')
  try{const r=await fetch('/api/rh/impressora',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(rede)});const d=await r.json();if(!r.ok)throw Error(d.error);setRede(d);setRedeAlterada(false);toast.success('Impressora de rede do RH salva.')}
  catch(e:any){toast.error(e.message)}finally{setOcupado(false)}
 }
 async function testarRede(){
  setOcupado(true);setResultado('')
  try{const r=await fetch('/api/rh/impressora',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error);setResultado(d.mensagem)}
  catch(e:any){toast.error(e.message)}finally{setOcupado(false)}
 }
 useEffect(()=>{setMargem(lerImpressaoRH().margem)},[])
 function salvar(e:React.FormEvent){
  e.preventDefault()
  if(!Number.isInteger(margem)||margem<5||margem>25){toast.error('Informe uma margem entre 5 e 25 mm.');return}
  try{localStorage.setItem(CHAVE_IMPRESSORA_RH,JSON.stringify({margem}));setAlterado(false);toast.success('Preferências salvas neste navegador.')}
  catch{toast.error('O navegador não permitiu salvar as preferências.')}
 }
 function testar(){
  try{abrirDocumento('Teste de impressão do RH',estiloImpressaoRH()+'<h1>Teste de impressão do RH</h1><p>Papel A4 · orientação retrato</p><div style="border:1px solid #111;padding:10mm"><p>Confira se este quadro aparece inteiro, sem cortar as bordas.</p><p>INSS · FGTS · IRRF · R$ 1.234,56</p></div><p>Selecione a impressora desejada na janela de impressão.</p>')}
  catch(e:any){toast.error(e.message)}
 }
 return <div className="max-w-3xl space-y-8">
 <section className="space-y-4">
  <h2 className="text-xl font-semibold">Impressora de rede do RH</h2>
  <p className="text-sm text-slate-600">Cadastre o endereço da impressora de documentos. Esta configuração é compartilhada nesta instalação e fica registrada nos logs do sistema.</p>
  {erroRede?<div role="alert">{erroRede} <Button type="button" variant="outline" onClick={()=>void carregarRede()}>Recarregar</Button></div>:!rede?<p>Carregando impressora...</p>:<form onSubmit={salvarRede} className="space-y-4">
   <fieldset disabled={ocupado} className="grid gap-4 sm:grid-cols-2">
    <label className="sm:col-span-2">Nome da impressora<Input required maxLength={100} value={rede.nome} onChange={e=>{setRede({...rede,nome:e.target.value});setRedeAlterada(true);setResultado('')}}/></label>
    <label>IP na rede local<Input required placeholder="192.168.1.150" value={rede.ip} onChange={e=>{setRede({...rede,ip:e.target.value});setRedeAlterada(true);setResultado('')}}/></label>
    <label>Porta de rede<Input type="number" required min={1} max={65535} value={rede.porta} onChange={e=>{setRede({...rede,porta:Number(e.target.value)});setRedeAlterada(true);setResultado('')}}/><span className="text-xs text-slate-600">RAW: 9100 a 9109 · IPP: 631 · LPD: 515</span></label>
   </fieldset>
   <div className="flex flex-wrap gap-2"><Button disabled={ocupado} type="submit">Salvar impressora de rede</Button><Button disabled={ocupado||redeAlterada||!rede.ip} type="button" variant="outline" onClick={()=>void testarRede()}>Testar conexão de rede</Button></div>
   {resultado&&<p role="status" className="text-sm text-green-700">{resultado}</p>}
  </form>}
  <p className="text-sm text-slate-600">Para imprimir, instale a impressora no Windows pelo mesmo IP e selecione-a na janela de impressão. O cadastro e o teste de conexão não enviam os holerites diretamente pela rede.</p>
 </section>
 <form onSubmit={salvar} className="space-y-5 border-t pt-6">
  <h2 className="text-xl font-semibold">Impressora da folha de pagamento</h2>
  <p className="text-sm text-slate-600">Holerites e resumos usam papel A4, em retrato. Selecione uma impressora de documentos ou Salvar como PDF na janela de impressão. A impressora térmica do bar usa outro formato.</p>
  <label className="block max-w-xs">Margens do documento (mm)<Input type="number" required min={5} max={25} step={1} value={margem} onChange={e=>{setMargem(Number(e.target.value));setAlterado(true)}}/></label>
  <p className="text-sm text-slate-600">As margens são salvas somente neste navegador e aplicadas às próximas impressões do RH. A escolha da impressora e das cópias é feita na janela de impressão.</p>
  <div className="flex flex-wrap gap-2"><Button type="submit">Salvar preferências</Button><BotaoImpressao type="button" variant="outline" disabled={alterado} onClick={testar}>Abrir teste de impressão</BotaoImpressao></div>
 </form></div>
}
