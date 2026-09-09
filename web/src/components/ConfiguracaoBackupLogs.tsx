'use client'
import {useCallback,useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {verificarPermissao} from '@/lib/usuario-atual'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {toast} from 'sonner'
const data=(v:string)=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—'
export default function ConfiguracaoBackupLogs({tipo}:{tipo:'backup'|'logs'}){
 const db=createClient(),[admin,setAdmin]=useState<boolean|null>(null),[rows,setRows]=useState<any[]>([]),[online,setOnline]=useState(false),[busy,setBusy]=useState(false),[erro,setErro]=useState(''),[pagina,setPagina]=useState(0),[categoria,setCategoria]=useState(''),[filtro,setFiltro]=useState(''),[busca,setBusca]=useState(''),[inicio,setInicio]=useState(''),[fim,setFim]=useState('')
 useEffect(()=>{let ativo=true;void(async()=>{try{const {data:{user}}=await db.auth.getUser();const p=user?await verificarPermissao(db,user.id,'configuracoes'):null;if(ativo)setAdmin(!!p?.isAdmin)}catch{if(ativo)setAdmin(false)}})();return()=>{ativo=false}},[db])
 const carregar=useCallback(async()=>{
  if(!admin)return;setBusy(true);setErro('')
  try{if(tipo==='backup'){const r=await fetch('/api/sistema/backups');const d=await r.json();if(!r.ok)throw Error(d.error);setRows(d.backups);setOnline(d.online)}else{
   let q=db.from('sistema_auditoria').select('*').order('criado_em',{ascending:false}).order('id',{ascending:false}).range(pagina*50,pagina*50+49)
   if(categoria)q=q.eq('tipo',categoria)
   if(busca)q=q.ilike('usuario_nome','%'+busca.replace(/[%_\\]/g,'')+'%')
   if(inicio)q=q.gte('criado_em',inicio+'T00:00:00-03:00')
   if(fim)q=q.lte('criado_em',fim+'T23:59:59.999999-03:00')
   const {data,error}=await q;if(error)throw Error('Não foi possível carregar os logs. Verifique a migração.');setRows(data||[])
  }}catch(e:any){setErro(e.message)}finally{setBusy(false)}
 },[admin,tipo,db,pagina,categoria,busca,inicio,fim])
 useEffect(()=>{void carregar();if(tipo==='backup'){const timer=setInterval(()=>void carregar(),5000);return()=>clearInterval(timer)}},[carregar,tipo])
 async function gerar(){setBusy(true);try{const r=await fetch('/api/sistema/backups',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error);toast.success('Backup solicitado');await carregar()}catch(e:any){toast.error(e.message)}finally{setBusy(false)}}
 if(admin===null)return <p>Verificando acesso...</p>
 if(!admin)return <p>Backup e logs são restritos ao administrador.</p>
 return <div className="space-y-4">
  <h2 className="text-xl font-semibold">{tipo==='backup'?'Backup do sistema':'Logs do sistema'}</h2>
  {erro&&<p role="alert" className="text-red-700">{erro}</p>}
  {tipo==='backup'?<>
   <p>Inclui o banco completo, usuários de acesso, configurações salvas no banco e arquivos do Supabase Storage.</p>
   <p className="text-sm text-slate-600">Para manter banco e anexos consistentes, execute sem uploads ou exclusões em andamento. A imagem Docker, a stack e arquivos externos ao Storage devem ser guardados separadamente. O arquivo contém dados do sistema: guarde-o em local protegido, preferencialmente fora deste computador.</p>
   <p role="status">Serviço de backup: {online?'Disponível':'Indisponível — atualize a stack com o serviço de backup.'}</p>
   <Button onClick={()=>void gerar()} disabled={busy||!online||rows.some(r=>['pendente','executando'].includes(r.status))}>Gerar backup agora</Button>
   <div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{['Solicitado em','Estado','Tamanho','Arquivo'].map(s=><th className="p-2 text-left" key={s}>{s}</th>)}</tr></thead><tbody>{rows.map(r=><tr className="border-t" key={r.id}><td className="p-2">{data(r.criado_em)}</td><td className="p-2">{r.status}{r.erro&&<p className="text-red-700">{r.erro}</p>}</td><td className="p-2">{r.tamanho?(Number(r.tamanho)/1048576).toFixed(1)+' MB':'—'}</td><td className="p-2">{r.status==='concluido'&&<><a className="underline text-blue-700" href={'/api/sistema/backups/'+r.id}>Baixar backup</a><details><summary>Verificação SHA-256</summary><code className="break-all">{r.sha256}</code></details></>}</td></tr>)}</tbody></table></div>
   {!rows.length&&<p>Nenhum backup gerado.</p>}
  </>:<>
   <p className="text-sm text-slate-600">Histórico a partir da ativação da auditoria. Mostra os campos alterados, sem copiar senhas, tokens ou conteúdo de mensagens. Operações sem usuário autenticado são identificadas como Sistema / integração. Acessos a páginas são informados pelo navegador.</p>
   <form className="flex flex-wrap gap-2 items-end" onSubmit={e=>{e.preventDefault();setBusca(filtro);setPagina(0)}}><label className="text-sm">Usuário<Input value={filtro} onChange={e=>setFiltro(e.target.value)} maxLength={100}/></label><label className="text-sm">Tipo<select className="block border rounded p-2" value={categoria} onChange={e=>{setCategoria(e.target.value);setPagina(0)}}><option value="">Todos</option><option value="alteracao">Alterações</option><option value="autenticacao">Login / logout</option><option value="pagina">Acesso a páginas</option><option value="backup">Backups</option></select></label><label className="text-sm">De<Input type="date" value={inicio} onChange={e=>{setInicio(e.target.value);setPagina(0)}}/></label><label className="text-sm">Até<Input type="date" value={fim} onChange={e=>{setFim(e.target.value);setPagina(0)}}/></label><Button type="submit" disabled={busy}>Filtrar</Button><Button type="button" variant="outline" disabled={busy} onClick={()=>void carregar()}>Atualizar</Button></form>
   <div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{['Data (Brasília)','Quem','Ação','Tabela / página / registro','Campos alterados'].map(s=><th key={s} className="text-left p-2">{s}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t align-top"><td className="p-2 whitespace-nowrap">{data(r.criado_em)}</td><td className="p-2">{r.usuario_nome}</td><td className="p-2">{r.acao}</td><td className="p-2 break-all">{r.tabela}<br/>{r.registro}</td><td className="p-2">{r.campos?.join(', ')||'—'}</td></tr>)}</tbody></table></div>
   {!rows.length&&<p>Nenhum evento para estes filtros.</p>}
   <div className="flex gap-3 items-center"><Button variant="outline" disabled={!pagina||busy} onClick={()=>setPagina(p=>p-1)}>Anterior</Button><span>Página {pagina+1}</span><Button variant="outline" disabled={rows.length<50||busy} onClick={()=>setPagina(p=>p+1)}>Próxima</Button></div>
  </>}
 </div>
}
