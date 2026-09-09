'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {verificarPermissao} from '@/lib/usuario-atual'
import {dataServico,hojeServicos,periodoServicos,STATUS_SERVICOS,StatusServico,VisaoServicos} from '@/lib/servicos'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {toast} from 'sonner'
import {estiloServico,useCoresServicos,CoresServicosProvider,PaletaServicos,SelosServico} from '@/components/servicos-cores'

type Tarefa={id:string;titulo:string;descricao:string;data:string;responsavel_id:string|null;prioridade:string;status:StatusServico;updated_at:string}
type Formulario={titulo:string;descricao:string;data:string;responsavel_id:string;prioridade:string;status:StatusServico}
const nomesDias=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const novo=(data:string):Formulario=>({titulo:'',descricao:'',data,responsavel_id:'',prioridade:'normal',status:'a_fazer'})

export default function ServicosPage(){return <CoresServicosProvider><QuadroServicos/></CoresServicosProvider>}
function QuadroServicos(){
 const cores=useCoresServicos()
 const [admin,setAdmin]=useState(false)
 const db=createClient()
 const [autorizado,setAutorizado]=useState<boolean|null>(null)
 const [visao,setVisao]=useState<VisaoServicos>('semana')
 const [data,setData]=useState(hojeServicos)
 const [tarefas,setTarefas]=useState<Tarefa[]>([])
 const [responsaveis,setResponsaveis]=useState<{id:string;nome:string}[]>([])
 const [loading,setLoading]=useState(false)
 const [erro,setErro]=useState(false)
 const [limite,setLimite]=useState(100)
 const [total,setTotal]=useState(0)
 const [form,setForm]=useState<Formulario|null>(null)
 const [editando,setEditando]=useState<Tarefa|null>(null)
 const [salvando,setSalvando]=useState(false)
 const [arrastando,setArrastando]=useState<Tarefa|null>(null)
 const requisicao=useRef(0)
 const periodo=periodoServicos(data,visao)
 useEffect(()=>{let ativo=true;void(async()=>{
  try{const {data:{user}}=await db.auth.getUser();const p=user?await verificarPermissao(db,user.id,'servicos'):null;if(ativo){setAutorizado(!!p?.autorizado);setAdmin(!!p?.isAdmin)}}catch{if(ativo)setAutorizado(false)}
 })();return()=>{ativo=false}},[db])
 const carregar=useCallback(async()=>{
  if(!autorizado)return
  const id=++requisicao.current
  setLoading(true)
  try{
   const [r,u]=await Promise.all([
    db.from('servicos_tarefas').select('*',{count:'exact'}).gte('data',periodo.inicio).lte('data',periodo.fim).order('data').order('id').limit(limite),
    db.rpc('servicos_responsaveis')
   ])
   if(r.error||u.error)throw new Error()
   if(id!==requisicao.current)return
   setTarefas(r.data||[]);setTotal(r.count||0);setResponsaveis(u.data||[]);setErro(false)
  }catch{if(id===requisicao.current)setErro(true)}
  finally{if(id===requisicao.current)setLoading(false)}
 },[autorizado,db,periodo.inicio,periodo.fim,limite])
 useEffect(()=>{void carregar();const timer=setInterval(()=>void carregar(),30000);return()=>{clearInterval(timer);requisicao.current++}},[carregar])
 function abrir(t?:Tarefa,dia=data,status:StatusServico='a_fazer'){setEditando(t||null);setForm(t?{titulo:t.titulo,descricao:t.descricao,data:t.data,responsavel_id:t.responsavel_id||'',prioridade:t.prioridade,status:t.status}:{...novo(dia),status})}
 async function salvar(e:React.FormEvent){
  e.preventDefault();if(!form)return
  setSalvando(true)
  try{
   periodoServicos(form.data,'dia')
   const payload={...form,titulo:form.titulo.trim(),responsavel_id:form.responsavel_id||null}
   const q=editando?db.from('servicos_tarefas').update(payload).eq('id',editando.id).eq('updated_at',editando.updated_at):db.from('servicos_tarefas').insert(payload)
   const {error}=await q.select('id').single()
   if(error)throw error
   setForm(null);toast.success(editando?'Serviço atualizado':'Serviço cadastrado');void carregar()
  }catch{toast.error('Não foi possível salvar. Verifique os dados ou reabra a tarefa caso outra pessoa a tenha alterado.')}
  finally{setSalvando(false)}
 }
 async function mover(t:Tarefa,alteracao:Partial<Pick<Tarefa,'data'|'status'>>){
  if(salvando)return
  setSalvando(true)
  try{const {error}=await db.from('servicos_tarefas').update(alteracao).eq('id',t.id).eq('updated_at',t.updated_at).select('id').single();if(error)throw error;await carregar()}
  catch{toast.error('Não foi possível mover. Atualize o quadro para conferir alterações da equipe.');void carregar()}
  finally{setSalvando(false);setArrastando(null)}
 }
 async function excluir(){
  if(!editando||!window.confirm('Excluir esta tarefa? Esta ação não poderá ser desfeita.'))return
  setSalvando(true)
  try{const {error}=await db.from('servicos_tarefas').delete().eq('id',editando.id).eq('updated_at',editando.updated_at).select('id').single();if(error)throw error;setForm(null);toast.success('Tarefa excluída');void carregar()}
  catch{toast.error('Não foi possível excluir. Atualize o quadro.')}
  finally{setSalvando(false)}
 }
 function navegar(direcao:number){
  const d=new Date(data+'T12:00:00Z')
  if(visao==='mes')d.setUTCMonth(d.getUTCMonth()+direcao,1)
  else d.setUTCDate(d.getUTCDate()+direcao*(visao==='semana'?7:1))
  setData(d.toISOString().slice(0,10));setLimite(100)
 }
 const dias:string[]=[]
 for(let d=new Date(periodo.inicio+'T12:00:00Z');d.toISOString().slice(0,10)<=periodo.fim;d.setUTCDate(d.getUTCDate()+1))dias.push(d.toISOString().slice(0,10))
 const colunas=visao==='dia'?STATUS_SERVICOS.map(s=>({id:s.id,nome:s.nome,dia:data})):dias.map(d=>({id:d,nome:nomesDias[new Date(d+'T12:00:00Z').getUTCDay()],dia:d}))
 if(autorizado===null)return <p>Verificando acesso...</p>
 if(!autorizado)return <p>Você não tem acesso ao módulo Serviços. Solicite a permissão ao administrador.</p>
 return <div className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Kanban de Serviços</h1><p className="text-muted-foreground">Cadastre as tarefas em cada dia e acompanhe o andamento da equipe.</p></div><Button onClick={()=>abrir()}>Novo serviço</Button></div>
  <div className="flex flex-wrap gap-2 items-center"><div className="flex gap-1">{(['dia','semana','mes'] as const).map(v=><Button key={v} variant={visao===v?'default':'outline'} onClick={()=>{setVisao(v);setLimite(100)}}>{v==='dia'?'Dia':v==='semana'?'Semana':'Mês'}</Button>)}</div><Button variant="outline" onClick={()=>navegar(-1)} aria-label="Período anterior">←</Button><Input className="w-40" aria-label="Data de referência" type="date" value={data} onChange={e=>{if(e.target.value){try{periodoServicos(e.target.value,'dia');setData(e.target.value);setLimite(100)}catch{}}}}/><Button variant="outline" onClick={()=>navegar(1)} aria-label="Próximo período">→</Button><Button variant="outline" onClick={()=>{setData(hojeServicos());setLimite(100)}}>Hoje</Button><Button variant="outline" onClick={()=>void carregar()} disabled={loading}>{loading?'Atualizando...':'Atualizar'}</Button></div>
  <p className="text-sm text-muted-foreground">{dataServico(periodo.inicio)} a {dataServico(periodo.fim)} · {total} tarefas · {visao==='dia'?'Arraste para mudar o status.':'Arraste para outro dia. O status pode ser alterado no cartão.'}</p>
  <PaletaServicos admin={admin}/>
  {erro?<p role="alert" className="text-red-600">Não foi possível carregar o quadro. Tente atualizar novamente.</p>:<div className="overflow-x-auto"><div className={visao==='dia'?'grid grid-cols-3 gap-3 min-w-[750px]':'grid grid-cols-7 gap-3 min-w-[1400px]'}>
   {visao==='mes'&&['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'].map(d=><div key={d} className="font-semibold text-center">{d}</div>)}
   {visao==='mes'&&Array.from({length:(new Date(periodo.inicio+'T12:00:00Z').getUTCDay()+6)%7},(_,i)=><div key={'vazio'+i}/>)}
   {colunas.map(col=>{const itens=tarefas.filter(t=>visao==='dia'?t.data===col.dia&&t.status===col.id:t.data===col.dia);return <section key={col.id} className="rounded-lg border bg-slate-50 p-3 min-h-44" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(arrastando)void mover(arrastando,visao==='dia'?{status:col.id as StatusServico}:{data:col.dia})}}>
    <div className="mb-3 flex items-start justify-between gap-1"><div><h2 className="font-semibold">{col.nome}</h2><p className="text-xs text-muted-foreground">{dataServico(col.dia)} · {itens.length}</p></div><button type="button" aria-label={'Adicionar serviço em '+dataServico(col.dia)} className="rounded border px-2" onClick={()=>abrir(undefined,col.dia,visao==='dia'?col.id as StatusServico:'a_fazer')}>+</button></div>
    <div className="space-y-3">{itens.map(t=><article key={t.id} draggable={!salvando} onDragStart={()=>setArrastando(t)} onDragEnd={()=>setArrastando(null)} className="rounded-lg border border-l-4 p-3 shadow-sm space-y-2" style={estiloServico(cores,t.status,t.prioridade)}>
     <SelosServico status={t.status} prioridade={t.prioridade}/>
     <button className="text-left font-medium break-words w-full" onClick={()=>abrir(t)}>{t.titulo}</button>
     {t.descricao&&<p className="text-xs text-muted-foreground whitespace-pre-wrap break-words line-clamp-3">{t.descricao}</p>}
     <p className="text-xs">{t.responsavel_id?(responsaveis.find(u=>u.id===t.responsavel_id)?.nome||'Responsável indisponível'):'Sem responsável'}</p>
     <p className={'text-xs '+(t.prioridade==='alta'?'text-red-600 font-semibold':'text-muted-foreground')}>Prioridade {t.prioridade==='alta'?'urgente':t.prioridade}{t.data<hojeServicos()&&t.status!=='concluido'?' · Atrasado':''}</p>
     <select aria-label={'Status de '+t.titulo} className="w-full rounded border p-1 text-xs bg-white" value={t.status} disabled={salvando} onChange={e=>void mover(t,{status:e.target.value as StatusServico})}>{STATUS_SERVICOS.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select>
     <button className="text-xs underline" onClick={()=>abrir(t)}>Editar serviço</button>
    </article>)}{!itens.length&&<p className="text-xs text-muted-foreground">Nenhuma tarefa</p>}</div>
   </section>})}
  </div></div>}
  {total>tarefas.length&&<Button variant="outline" onClick={()=>setLimite(l=>l+100)} disabled={loading}>Carregar mais tarefas ({tarefas.length} de {total})</Button>}
  {form&&<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={salvar} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto space-y-4" role="dialog" aria-modal="true" aria-label={editando?'Editar serviço':'Novo serviço'}>
   <h2 className="text-xl font-bold">{editando?'Editar serviço':'Novo serviço'}</h2>
   <label className="block text-sm">Título<Input required minLength={3} maxLength={160} value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}/></label>
   <label className="block text-sm">Descrição<textarea maxLength={2000} className="w-full border rounded p-2" rows={3} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></label>
   <label className="block text-sm">Dia do serviço<Input required type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/></label>
   <label className="block text-sm">Responsável<select className="w-full border rounded p-2 bg-white" value={form.responsavel_id} onChange={e=>setForm({...form,responsavel_id:e.target.value})}><option value="">Sem responsável</option>{form.responsavel_id&&!responsaveis.some(u=>u.id===form.responsavel_id)&&<option value={form.responsavel_id}>Responsável indisponível</option>}{responsaveis.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}</select></label>
   <label className="block text-sm">Prioridade<select className="w-full border rounded p-2 bg-white" value={form.prioridade} onChange={e=>setForm({...form,prioridade:e.target.value})}>{['baixa','normal','alta'].map(p=><option key={p} value={p}>{p==='alta'?'Urgente':p==='normal'?'Normal':'Baixa'}</option>)}</select></label>
   <label className="block text-sm">Status<select className="w-full border rounded p-2 bg-white" value={form.status} onChange={e=>setForm({...form,status:e.target.value as StatusServico})}>{STATUS_SERVICOS.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select></label>
   <div className="rounded-lg border border-l-4 p-3 space-y-2" style={estiloServico(cores,form.status,form.prioridade)}><p className="text-xs text-slate-600">Prévia do cartão</p><SelosServico status={form.status} prioridade={form.prioridade}/><p className="font-medium break-words">{form.titulo||'Título do serviço'}</p></div>
   <div className="flex gap-2 flex-wrap"><Button type="submit" disabled={salvando}>{salvando?'Salvando...':'Salvar'}</Button><Button type="button" variant="outline" onClick={()=>setForm(null)} disabled={salvando}>Cancelar</Button>{editando&&<Button type="button" variant="destructive" onClick={()=>void excluir()} disabled={salvando}>Excluir tarefa</Button>}</div>
  </form></div>}
 </div>
}
