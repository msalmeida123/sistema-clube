'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card,CardHeader,CardTitle,CardDescription,CardContent} from '@/components/ui/card'
const url='/api/configuracoes/avisos/tempo'
async function api(init?:RequestInit){const r=await fetch(url,{...init,cache:'no-store'});if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('Não foi possível acessar as configurações.');const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível salvar.');return d}
export default function ConfiguracaoAvisos(){
 const [ativo,setAtivo]=useState(false),[tempo,setTempo]=useState('15'),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[erro,setErro]=useState(''),[ok,setOk]=useState('')
 async function carregar(){setLoading(true);setErro('');try{const d=await api();setAtivo(d.tempo_segundos>0);setTempo(String(d.tempo_segundos||15))}catch(e){setErro((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{carregar()},[])
 async function salvar(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setErro('');setOk('');try{await api({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({tempo_segundos:ativo?Number(tempo):0})});setOk(ativo?`Tempo salvo: ${tempo} segundos. Vale para os próximos avisos abertos no aplicativo.`:'Fechamento automático desativado. O associado fecha pelo botão Fechar.')}catch(e){setErro((e as Error).message)}finally{setBusy(false)}}
 return <Card><CardHeader><CardTitle>Avisos do aplicativo</CardTitle><CardDescription>Publique fotos, cartazes de shows e comunicados em tela cheia para os associados.</CardDescription></CardHeader><CardContent className="space-y-4">
 <Button asChild><Link href="/dashboard/avisos">Cadastrar e gerenciar avisos</Link></Button>
 {loading?<p role="status">Carregando tempo de exibição…</p>:<form onSubmit={salvar} className="space-y-3 border-t pt-4">
 <label className="flex items-center gap-2"><input type="checkbox" checked={ativo} disabled={busy} onChange={e=>{setAtivo(e.target.checked);setOk('')}}/>Fechar aviso automaticamente</label>
 <div><label htmlFor="tempo-aviso" className="text-sm font-medium">Tempo no celular (segundos)</label><Input id="tempo-aviso" type="number" min={1} max={60} step={1} required disabled={!ativo||busy} value={tempo} onChange={e=>{setTempo(e.target.value);setOk('')}} className="max-w-40" aria-describedby="tempo-ajuda"/></div>
 <p id="tempo-ajuda" className="text-sm text-muted-foreground">Escolha de 1 a 60 segundos. A contagem começa quando a imagem carrega e pausa com o aplicativo em segundo plano. O associado pode fechar antes ou escolher Manter aberto. Avisos consultados pela lista ficam abertos até serem fechados.</p>
 <Button disabled={busy} type="submit">{busy?'Salvando…':'Salvar tempo'}</Button>
 </form>}
 {erro&&<div role="alert"><p className="text-red-700">{erro}</p><Button variant="outline" type="button" onClick={carregar} disabled={loading||busy}>Recarregar configuração</Button></div>}{ok&&<p role="status">{ok}</p>}
 </CardContent></Card>
}
