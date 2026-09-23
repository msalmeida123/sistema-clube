 'use client'
import {useEffect,useRef,useState} from 'react'
import {Megaphone,ImagePlus,Smartphone} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card,CardHeader,CardTitle,CardContent} from '@/components/ui/card'
import {CartazAviso,ModalAviso} from './CartazAviso'
import {AvisoAplicativo,avisoDisponivel} from '@/lib/avisos-aplicativo'
import styles from './avisos.module.css'
const endpoint='/api/configuracoes/avisos'
async function api(init?:RequestInit,pagina=0){const r=await fetch(endpoint+'?pagina='+pagina,{...init,cache:'no-store'});if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('Serviço indisponível. Tente novamente.');const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível concluir a operação.');return d}
export default function PainelAvisos(){
 const [titulo,setTitulo]=useState(''),[descricao,setDescricao]=useState(''),[validade,setValidade]=useState(''),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[avisos,setAvisos]=useState<AvisoAplicativo[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[erro,setErro]=useState(''),[mensagem,setMensagem]=useState(''),[ver,setVer]=useState<AvisoAplicativo|null>(null),[pagina,setPagina]=useState(0),[mais,setMais]=useState(false)
 const input=useRef<HTMLInputElement>(null),pedido=useRef(''),lock=useRef(false)
 async function carregar(p=pagina){setLoading(true);try{const d=await api(undefined,p);setAvisos(d.avisos);setMais(d.mais);setPagina(p)}catch(e){setErro((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{carregar(0)},[])
 useEffect(()=>{if(!file){setPreview('');return}const u=URL.createObjectURL(file);setPreview(u);return()=>URL.revokeObjectURL(u)},[file])
 function selecionar(f?:File){setErro('');setFile(null);pedido.current='';if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||!f.size||f.size>8*1024*1024){setErro('Use JPG, PNG ou WEBP de até 8 MB.');if(input.current)input.current.value='';return}setFile(f)}
 async function salvar(e:React.FormEvent){e.preventDefault();if(lock.current||!file)return;lock.current=true;setBusy(true);setErro('');setMensagem('');try{
  if(!pedido.current)pedido.current=crypto.randomUUID()
  const body=new FormData();body.set('id',pedido.current);body.set('titulo',titulo);body.set('descricao',descricao);body.set('validade',validade);body.set('imagem',file)
  await api({method:'POST',body});setTitulo('');setDescricao('');setValidade('');setFile(null);pedido.current='';if(input.current)input.current.value='';setMensagem('Rascunho salvo. Confira a prévia e clique em Publicar para exibir no aplicativo.');await carregar(0)
 }catch(e){setErro((e as Error).message)}finally{lock.current=false;setBusy(false)}}
 async function mudar(a:AvisoAplicativo){if(lock.current)return;lock.current=true;setBusy(true);setErro('');setMensagem('');try{await api({method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:a.id,acao:a.ativo?'pausar':'publicar'})});setMensagem(a.ativo?'Aviso pausado. Ele não aparece mais no aplicativo.':'Aviso publicado para os associados do clube.');await carregar()}catch(e){setErro((e as Error).message)}finally{lock.current=false;setBusy(false)}}
 const imagem=(id:string)=>endpoint+'?imagem='+id
 return <div className="space-y-6 max-w-6xl mx-auto">
 <header><h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone aria-hidden="true"/>Avisos do aplicativo</h1><p className="text-muted-foreground mt-2">Divulgue shows, eventos e comunicados com imagem em tela cheia no app do associado.</p></header>
 {erro&&<p role="alert" className="border border-red-300 bg-red-50 text-red-800 rounded-lg p-4">{erro}</p>}{mensagem&&<p role="status" className="border rounded-lg p-4">{mensagem}</p>}
 <div className="grid lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Novo aviso</CardTitle></CardHeader><CardContent>
 <form onSubmit={salvar} className="space-y-5"><div><Label htmlFor="aviso-nome">Título do aviso</Label><Input id="aviso-nome" required minLength={3} maxLength={120} value={titulo} disabled={busy} onChange={e=>{setTitulo(e.target.value);pedido.current=''}} placeholder="Ex.: Show de sábado no clube"/></div>
 <div><Label htmlFor="aviso-imagem">Imagem ou cartaz</Label><Input ref={input} id="aviso-imagem" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={e=>selecionar(e.target.files?.[0])}/><p className="text-sm text-muted-foreground mt-2">JPG, PNG ou WEBP, até 8 MB. Prefira um cartaz vertical de 1080 × 1920 pixels. A imagem será exibida inteira, sem cortes.</p></div>
 <div><Label htmlFor="aviso-texto">Informações do aviso</Label><textarea id="aviso-texto" rows={4} maxLength={2000} value={descricao} disabled={busy} onChange={e=>{setDescricao(e.target.value);pedido.current=''}} className="w-full border rounded-md p-3 bg-background" placeholder="Data, horário, local e demais informações que aparecem no cartaz."/><p className="text-sm text-muted-foreground">O texto também ajuda quem usa leitor de tela.</p></div>
 <div><Label htmlFor="aviso-validade">Exibir até (opcional)</Label><Input id="aviso-validade" type="date" value={validade} disabled={busy} onChange={e=>{setValidade(e.target.value);pedido.current=''}}/><p className="text-sm text-muted-foreground mt-2">Até o fim desse dia, no horário de Brasília. Sem data, fica ativo até você pausar.</p></div>
 <p className="text-sm">Após publicar, o aviso aparece ao abrir o aplicativo. Ao fechar, o associado não o recebe novamente e pode consultá-lo em Avisos do clube.</p>
 <Button type="submit" disabled={busy||!file}><ImagePlus className="w-4 h-4 mr-2"/>{busy?'Aguarde…':'Salvar rascunho'}</Button></form>
 </CardContent></Card>
 <Card><CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5"/>Prévia no celular</CardTitle></CardHeader><CardContent><div className={styles.phone}><CartazAviso titulo={titulo||'Título do aviso'} descricao={descricao} imagem={preview}/></div><p className="text-sm text-center text-muted-foreground mt-4">Prévia ilustrativa. Salvar rascunho ainda não publica o aviso.</p></CardContent></Card></div>
 <section><div className="flex items-center justify-between gap-4 mb-4"><h2 className="text-xl font-semibold">Avisos cadastrados</h2><Button variant="outline" disabled={loading||busy} onClick={()=>{setErro('');carregar()}}>Atualizar</Button></div>
 {loading?<p role="status">Carregando avisos…</p>:!avisos.length?<p className="border rounded-lg p-6 text-muted-foreground">Nenhum aviso cadastrado. Crie o primeiro cartaz acima.</p>:<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{avisos.map(a=>{const vencido=!!a.expira_em&&Date.parse(a.expira_em)<=Date.now();return <Card key={a.id}><CardContent className="pt-6 space-y-3"><img src={imagem(a.id)} alt={a.titulo} loading="lazy" className="w-full h-48 object-contain bg-slate-900 rounded-lg"/><h3 className="font-semibold break-words">{a.titulo}</h3><p className="text-sm">{vencido?'Encerrado':avisoDisponivel({ativo:!!a.ativo,expira_em:a.expira_em})?'Publicado':a.publicado_em?'Pausado':'Rascunho'}{a.expira_em?' · Até '+new Date(a.expira_em).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):''}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setVer(a)}>Ver prévia</Button><Button disabled={busy||vencido&&!a.ativo} onClick={()=>mudar(a)}>{a.ativo?'Pausar':'Publicar'}</Button></div></CardContent></Card>})}</div>}
 <div className="flex justify-between items-center mt-4"><Button variant="outline" disabled={loading||busy||pagina===0} onClick={()=>carregar(pagina-1)}>Anterior</Button><span className="text-sm">Página {pagina+1}</span><Button variant="outline" disabled={loading||busy||!mais} onClick={()=>carregar(pagina+1)}>Próxima</Button></div>
 </section>{ver&&<ModalAviso titulo={ver.titulo} descricao={ver.descricao} imagem={imagem(ver.id)} onClose={()=>setVer(null)}/>}</div>
}
