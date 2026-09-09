'use client'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {toast} from 'sonner'

export function ConfiguracaoRHTab(){
 const [form,setForm]=useState<any>(null),[erro,setErro]=useState(''),[busy,setBusy]=useState(false),[resultado,setResultado]=useState(''),[alterado,setAlterado]=useState(false)
 async function carregar(){setErro('');try{const r=await fetch('/api/rh/configuracao');const d=await r.json();if(!r.ok)throw Error(d.error);setForm({...d,senha:''});setAlterado(false)}catch(e:any){setErro(e.message)}}
 useEffect(()=>{void carregar()},[])
 async function salvar(e:React.FormEvent){e.preventDefault();setBusy(true);try{const r=await fetch('/api/rh/configuracao',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.error);toast.success('Configuração salva');setResultado('');await carregar()}catch(e:any){toast.error(e.message)}finally{setBusy(false)}}
 async function testar(){setBusy(true);setResultado('');try{const r=await fetch('/api/rh/configuracao',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error);setResultado('Conectado. Série: '+d.serie+' · Firmware: '+d.firmware)}catch(e:any){toast.error(e.message)}finally{setBusy(false)}}
 if(erro)return <div role="alert">{erro}<Button variant="outline" onClick={()=>void carregar()}>Tentar novamente</Button></div>
 if(!form)return <p>Carregando configuração...</p>
 if(!form.isAdmin)return <p>A configuração do aparelho e da empresa é feita pelo administrador.</p>
 function mudar(campo:string,valor:unknown){setForm({...form,[campo]:valor});setAlterado(true);setResultado('')}
 return <form onSubmit={salvar} className="max-w-3xl space-y-5">
  <h2 className="text-xl font-semibold">Empresa e aparelho de ponto</h2>
  <fieldset disabled={busy} className="rounded-lg border p-4 grid gap-4 sm:grid-cols-2"><legend className="px-2 font-medium">Identificação na folha de pagamento</legend>
   <label>Nome da empresa<Input maxLength={160} value={form.empresa_nome} onChange={e=>mudar('empresa_nome',e.target.value)}/></label>
   <label>CNPJ / CPF do empregador<Input maxLength={30} value={form.empresa_documento} onChange={e=>mudar('empresa_documento',e.target.value)}/></label>
  </fieldset>
  <fieldset disabled={busy} className="rounded-lg border p-4 grid gap-4 sm:grid-cols-2"><legend className="px-2 font-medium">Control iD · API iDClass</legend>
   <label>Nome do aparelho<Input required maxLength={100} value={form.nome} onChange={e=>mudar('nome',e.target.value)}/></label>
   <label>IP na rede local<Input placeholder="192.168.1.150" value={form.ip} onChange={e=>mudar('ip',e.target.value)}/></label>
   <label>Protocolo<select className="block border rounded p-2 w-full" value={form.protocolo} onChange={e=>mudar('protocolo',e.target.value)}><option value="https">HTTPS</option><option value="http">HTTP</option></select></label>
   <label>Porta<Input type="number" required min={1} max={65535} value={form.porta} onChange={e=>mudar('porta',Number(e.target.value))}/></label>
   <label>Usuário do aparelho<Input autoComplete="off" maxLength={100} value={form.usuario} onChange={e=>mudar('usuario',e.target.value)}/></label>
   <label>Senha do aparelho<Input type="password" autoComplete="new-password" maxLength={200} value={form.senha} onChange={e=>mudar('senha',e.target.value)}/><span className="text-xs text-slate-600">{form.senha_configurada?'Senha salva. Deixe em branco para manter.':'Informe a senha configurada no relógio.'}</span></label>
   <label className="sm:col-span-2 flex items-center gap-2"><input type="checkbox" checked={form.certificado_local} onChange={e=>mudar('certificado_local',e.target.checked)}/>Aceitar certificado próprio deste aparelho na rede local</label>
  </fieldset>
  <p className="text-sm text-slate-600">Salve os dados antes de testar. O teste consulta a identificação do relógio. A importação automática das marcações ainda não está habilitada.</p>
  <div className="flex gap-2"><Button disabled={busy} type="submit">{busy?'Aguarde...':'Salvar configuração'}</Button><Button type="button" variant="outline" disabled={busy||alterado||!form.ip||!form.senha_configurada} onClick={()=>void testar()}>Testar conexão</Button></div>
  {resultado&&<p role="status" className="text-green-700">{resultado}</p>}
 </form>
}
