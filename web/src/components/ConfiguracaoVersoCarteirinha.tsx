 'use client'
import {useEffect,useRef,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card,CardHeader,CardTitle,CardDescription,CardContent} from '@/components/ui/card'
/** Salva o fundo separadamente para não descartar alterações de cores e ícone em edição. */
export default function ConfiguracaoVersoCarteirinha(){
 const [versao,setVersao]=useState<string|null>(null),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[erro,setErro]=useState(''),[sucesso,setSucesso]=useState('')
 const input=useRef<HTMLInputElement>(null)
 async function requisicao(method='GET',body?:FormData){const r=await fetch('/api/configuracoes/verso-carteirinha',{method,body,cache:'no-store'});if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('Serviço indisponível. Tente novamente.');const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível salvar a imagem.');return d}
 async function carregar(){setLoading(true);setErro('');try{setVersao((await requisicao()).versao)}catch(e){setErro((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{carregar()},[])
 useEffect(()=>{if(!file){setPreview('');return}const u=URL.createObjectURL(file);setPreview(u);return()=>URL.revokeObjectURL(u)},[file])
 function selecionar(f?:File){setErro('');setSucesso('');setFile(null);if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||!f.size||f.size>8*1024*1024){setErro('Use JPG, PNG ou WEBP de até 8 MB.');if(input.current)input.current.value='';return}setFile(f)}
 async function salvar(remover=false){if(busy)return;setBusy(true);setErro('');setSucesso('');try{const body=new FormData();if(file)body.set('imagem',file);const d=await requisicao(remover?'DELETE':'PUT',remover?undefined:body);setVersao(d.versao);setFile(null);if(input.current)input.current.value='';setSucesso(remover?'Imagem removida. O verso voltou ao padrão.':'Imagem salva. Reabra a carteirinha e gere novamente o PDF ou a impressão.')}catch(e){setErro((e as Error).message)}finally{setBusy(false)}}
 const url=preview||(versao?`/api/tema/verso-carteirinha?v=${versao}`:'')
 return <Card><CardHeader><CardTitle>Imagem do verso da carteirinha</CardTitle><CardDescription>Personalize o verso das carteirinhas. JPG, PNG ou WEBP de até 8 MB, com pelo menos 320 pixels em cada dimensão. Recomendado: imagem horizontal de 1011 × 638 pixels. A imagem será ajustada ao cartão sem cortes.</CardDescription></CardHeader>
 <CardContent className="space-y-4">
 {erro&&<p role="alert" className="text-destructive">{erro}</p>}{sucesso&&<p role="status">{sucesso}</p>}
 <div className="relative aspect-[85.6/54] overflow-hidden rounded-lg border bg-gray-100 flex items-center justify-center" aria-label="Prévia do verso da carteirinha">
 {url?<img src={url} alt="Prévia do verso" className="w-full h-full object-contain"/>:<span>Verso padrão do clube</span>}
 </div>
 {loading?<p role="status">Carregando imagem…</p>:<><Label htmlFor="verso-carteirinha">Escolher imagem do verso</Label><Input ref={input} id="verso-carteirinha" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>selecionar(e.target.files?.[0])}/>
 <div className="flex flex-wrap gap-2"><Button disabled={busy||!file} onClick={()=>salvar()}>{busy?'Aguarde…':'Salvar imagem do verso'}</Button><Button variant="outline" disabled={busy||!versao} onClick={()=>salvar(true)}>Remover imagem</Button>{file&&<Button variant="outline" disabled={busy} onClick={()=>{setFile(null);if(input.current)input.current.value=''}}>Cancelar seleção</Button>}</div>
 {erro&&<Button variant="outline" disabled={busy} onClick={carregar}>Recarregar imagem</Button>}
</>}
 </CardContent></Card>
}
