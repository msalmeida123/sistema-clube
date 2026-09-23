'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
type Config={ambiente:'sandbox'|'production';origem:string;atualizado_em:string|null;webhook:string}
export function ConfiguracoesGestao(){
 const [cfg,setCfg]=useState<Config|null>(null),[chave,setChave]=useState(''),[busy,setBusy]=useState(false),[erro,setErro]=useState(''),[aviso,setAviso]=useState('')
 async function api(body?:object){
  const r=await fetch('/api/gestao-clientes/configuracoes',{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'})
  let j;try{j=await r.json()}catch{throw Error('O servidor não respondeu. Recarregue a página e confira a configuração.')}
  if(!r.ok)throw Error(j.error||'Não foi possível atualizar a configuração.')
  return j
 }
 useEffect(()=>{void api().then(setCfg).catch(e=>setErro(e.message))},[])
 async function executar(acao:'salvar'|'testar'){
  if(busy||!cfg)return
  setBusy(true);setErro('');setAviso('')
  try{
   const j=await api(acao==='salvar'?{acao,ambiente:cfg.ambiente,chave}:{acao})
   if(acao==='salvar')setChave('')
   setAviso(j.mensagem)
   try{setCfg(await api())}catch{setErro('A operação foi concluída, mas não foi possível atualizar os detalhes. Recarregue a página.')}
  }catch(e){setErro(e instanceof Error?e.message:'Não foi possível conectar ao servidor.')}
  finally{setBusy(false)}
 }
 return <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
  <Link href="/gestao-clientes" className="inline-block underline">← Voltar para clientes e licenças</Link>
  <header><h1 className="text-3xl font-bold">Configurações</h1><p>Integração de pagamentos da gestão comercial</p></header>
  {erro&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-800">{erro}</p>}
  {aviso&&<p role="status" className="rounded border border-green-300 bg-green-50 p-4 text-green-900">{aviso}</p>}
  <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6"><h2 className="text-xl font-semibold">Asaas</h2>
   {!cfg?<p>Carregando configuração…</p>:<>
    <p className="rounded border bg-muted p-3"><strong>Ambiente: {cfg.ambiente==='sandbox'?'Sandbox — testes':'Produção'}</strong><br/>{cfg.ambiente==='sandbox'?'Use uma chave da conta Sandbox. Pagamentos de teste não liberam instalações de produção.':'Use a chave da conta de produção que receberá os pagamentos dos seus clientes.'}</p>
    <p>{cfg.origem==='painel'?'Chave cadastrada neste painel.':'Existe uma chave na configuração inicial da instalação. Use “Testar conexão atual” para verificar se ainda é válida.'}</p>
    {cfg.atualizado_em&&<p className="text-sm">Última atualização: {new Date(cfg.atualizado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p>}
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();void executar('salvar')}}>
     <fieldset disabled={busy} className="space-y-4"><label className="block font-medium">Nova chave de API do Asaas<Input className="mt-2" required type="password" autoComplete="off" spellCheck={false} minLength={20} maxLength={4096} value={chave} onChange={e=>setChave(e.target.value)} placeholder="Cole a chave aqui"/></label>
      <p className="text-sm text-muted-foreground">A chave é validada antes de substituir a anterior, fica criptografada no servidor e não é exibida novamente. Não é necessário usar o terminal ou reiniciar o sistema.</p>
      <div className="flex flex-wrap gap-3"><Button type="submit">{busy?'Aguarde…':'Validar e salvar chave'}</Button><Button type="button" variant="outline" onClick={()=>executar('testar')}>Testar conexão atual</Button></div>
     </fieldset>
    </form>
    <div className="space-y-2 border-t pt-4"><h3 className="font-semibold">Confirmação automática de pagamentos</h3><p className="text-sm">Além da chave válida, o webhook deve estar configurado no Asaas para avisar o sistema quando um pagamento for confirmado.</p><label className="block text-sm">Endereço de recebimento<Input readOnly value={cfg.webhook}/></label></div>
   </>}
  </section>
 </main>
}
