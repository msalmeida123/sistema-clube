 'use client'
import {useEffect,useRef,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card,CardHeader,CardTitle,CardDescription,CardContent} from '@/components/ui/card'
/** Salva o fundo separadamente para não descartar alterações de cores e ícone em edição. */
export default function ConfiguracaoFundoLogin(){
 const [versao,setVersao]=useState<string|null>(null),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[erro,setErro]=useState(''),[sucesso,setSucesso]=useState('')
 const input=useRef<HTMLInputElement>(null)
 async function requisicao(method='GET',body?:FormData){const r=await fetch('/api/configuracoes/fundo-login',{method,body,cache:'no-store'});if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('Serviço indisponível. Tente novamente.');const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível salvar o fundo.');return d}
 async function carregar(){setLoading(true);setErro('');try{setVersao((await requisicao()).versao)}catch(e){setErro((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{carregar()},[])
 useEffect(()=>{if(!file){setPreview('');return}const u=URL.createObjectURL(file);setPreview(u);return()=>URL.revokeObjectURL(u)},[file])
 function selecionar(f?:File){setErro('');setSucesso('');setFile(null);if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||!f.size||f.size>8*1024*1024){setErro('Use JPG, PNG ou WEBP de até 8 MB.');if(input.current)input.current.value='';return}setFile(f)}
 async function salvar(remover=false){if(busy)return;setBusy(true);setErro('');setSucesso('');try{const body=new FormData();if(file)body.set('imagem',file);const d=await requisicao(remover?'DELETE':'PUT',remover?undefined:body);setVersao(d.versao);setFile(null);if(input.current)input.current.value='';setSucesso(remover?'Imagem removida. O login voltou ao fundo padrão.':'Imagem salva. O novo fundo já está disponível no login.')}catch(e){setErro((e as Error).message)}finally{setBusy(false)}}
 const url=preview||(versao?`/api/tema/fundo-login?v=${versao}`:'')
 return <Card><CardHeader><CardTitle>Imagem de fundo do login</CardTitle><CardDescription>Personalize a tela de entrada do sistema. JPG, PNG ou WEBP de até 8 MB. Recomendado: imagem horizontal de 1920 × 1080 pixels. A imagem preenche a tela e pode ter as bordas recortadas.</CardDescription></CardHeader>
 <CardContent className="space-y-4">
 {erro&&<p role="alert" className="text-destructive">{erro}</p>}{sucesso&&<p role="status">{sucesso}</p>}
 <div className="relative aspect-video overflow-hidden rounded-lg border bg-gray-100 flex items-center justify-center" aria-label="Prévia do fundo da tela de login">
 {url&&<><img src={url} alt="Prévia da imagem de fundo" className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0 bg-black/35"/></>}
 <div className="relative bg-white text-gray-900 rounded-lg shadow p-4 w-1/2 max-w-56 text-center"><strong className="text-sm">Sistema de Clube</strong><div className="border rounded mt-3 p-1 text-xs text-left">E-mail</div><div className="border rounded mt-2 p-1 text-xs text-left">Senha</div><div className="mt-2 rounded bg-blue-700 text-white text-xs p-1">Entrar</div></div>
 </div>
 {loading?<p role="status">Carregando fundo…</p>:<><Label htmlFor="fundo-login">Escolher imagem de fundo</Label><Input ref={input} id="fundo-login" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>selecionar(e.target.files?.[0])}/>
 <div className="flex flex-wrap gap-2"><Button disabled={busy||!file} onClick={()=>salvar()}>{busy?'Aguarde…':'Salvar fundo do login'}</Button><Button variant="outline" disabled={busy||!versao} onClick={()=>salvar(true)}>Remover fundo</Button>{file&&<Button variant="outline" disabled={busy} onClick={()=>{setFile(null);if(input.current)input.current.value=''}}>Cancelar seleção</Button>}</div>
 {erro&&<Button variant="outline" disabled={busy} onClick={carregar}>Recarregar fundo</Button>}
 <a href="/login" target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline">Ver tela de login</a></>}
 </CardContent></Card>
}
