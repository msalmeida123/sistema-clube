'use client'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
type Dados={id:string;valor:number;status:string;imagem?:string;copiaCola?:string}
export function PixSandboxPortaria({setor}:{setor:'academia'|'clube'}){
 const [aberto,setAberto]=useState(false),[dados,setDados]=useState<Dados|null>(null),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false),[copiado,setCopiado]=useState(false)
 // A sondagem lê apenas a confirmação registrada pelo webhook, não quita contas.
 useEffect(()=>{
  if(!aberto)return
  let ativo=true;let timer:ReturnType<typeof setTimeout>;const controller=new AbortController()
  async function carregar(primeira=false){
   if(primeira){setOcupado(true);setErro('')}
   try{
    const r=await fetch(`/api/portaria/pix-sandbox?setor=${setor}${primeira?'':'&status=1'}`,{cache:'no-store',signal:controller.signal})
    const j=await r.json();if(!r.ok)throw Error(j.error||'Não foi possível consultar o Pix.')
    if(ativo){setDados(prev=>({...prev,...j}));setErro('')}
    if(ativo&&j.status!=='RECEIVED')timer=setTimeout(()=>carregar(false),5000)
   }catch(e){if(ativo)setErro(e instanceof Error?e.message:'Falha ao consultar o Pix.')}
   finally{if(ativo)setOcupado(false)}
  }
  carregar(true)
  return()=>{ativo=false;controller.abort();clearTimeout(timer)}
 },[aberto,setor])
 return <section className="rounded-lg border bg-white p-4 space-y-3" aria-label={`Pix de teste ${setor}`} data-pagamento-modal={aberto?'pix':undefined}>
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Pix — {setor==='academia'?'Academia':'Clube'}</h2><p className="text-sm text-amber-900">Sandbox: cobrança fictícia de R$ 5,00. Não pague pelo aplicativo do banco.</p></div><Button type="button" variant="outline" onClick={()=>{setAberto(v=>!v);setCopiado(false)}} aria-expanded={aberto}>{aberto?'Fechar Pix de teste':'Receber por Pix (teste)'}</Button></div>
  {aberto&&<div className="space-y-3">
   {ocupado&&<p role="status">Carregando QR Code…</p>}
   {erro&&<p role="alert" className="text-red-700">{erro} Feche e abra o teste para tentar novamente.</p>}
   {dados?.status==='RECEIVED'?<p role="status" className="rounded border border-green-700 bg-green-50 p-3 text-green-900"><strong className="block">Mensalidade confirmada com sucesso!</strong><span className="block text-sm">Simulação no Sandbox: sem quitação de mensalidade real ou alteração da liberação de acesso.</span></p>:dados&&<>
    <p role="status">{dados.status==='PENDING'?'Aguardando confirmação no Sandbox.':`Situação de teste: ${dados.status}`}</p>
    {dados.imagem&&<img src={`data:image/png;base64,${dados.imagem}`} alt={`QR Code Pix de teste da mensalidade ${setor}`} width={256} height={256} className="h-auto w-64 max-w-full"/>}
    {dados.copiaCola&&<><label className="block" htmlFor={`pix-${setor}`}>Pix copia e cola — somente teste</label><textarea id={`pix-${setor}`} readOnly value={dados.copiaCola} className="w-full min-w-0 rounded border p-2 break-all" rows={3}/><Button type="button" variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(dados.copiaCola!);setCopiado(true)}catch{setErro('Copie o código manualmente no campo acima.')}}}>{copiado?'Copiado':'Copiar código de teste'}</Button></>}
    <p className="text-sm">Na conta Sandbox do Asaas, localize a cobrança <strong className="break-all">{dados.id}</strong> e use “Confirmar pagamento”. Esta tela acompanha a confirmação automaticamente.</p>
   </>}
  </div>}
 </section>
}
