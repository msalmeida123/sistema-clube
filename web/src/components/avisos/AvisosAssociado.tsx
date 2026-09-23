 'use client'
import {useEffect,useRef,useState} from 'react'
import {Bell,ChevronRight,X} from 'lucide-react'
import {AvisoAplicativo} from '@/lib/avisos-aplicativo'
import {portalApi} from '@/lib/portal-api'
import {ModalAviso} from './CartazAviso'
import styles from './avisos.module.css'
const endpoint='/api/associado-app/avisos'
/** Fechar é imediato. O registro no servidor impede repetição em outros dispositivos. */
export function AvisosAssociado(){
 const [avisos,setAvisos]=useState<AvisoAplicativo[]>([]),[aberto,setAberto]=useState<AvisoAplicativo|null>(null),[galeria,setGaleria]=useState(false),[erro,setErro]=useState(''),[loading,setLoading]=useState(false)
 const [tempo,setTempo]=useState(0),[temporizado,setTemporizado]=useState(false)
 const dialog=useRef<HTMLDialogElement>(null),auto=useRef(new Set<string>()),modalAberto=useRef(false)
 modalAberto.current=!!aberto||galeria
 async function carregar(signal?:AbortSignal,automatico=false){setLoading(true);try{const d=await portalApi<{avisos:AvisoAplicativo[];tempo_segundos:number}>(endpoint,{signal});if(signal?.aborted)return;setAvisos(d.avisos);setTempo(d.tempo_segundos||0);setErro('');if(automatico&&!modalAberto.current){const proximo=d.avisos.find(a=>!a.fechado&&!auto.current.has(a.id));if(proximo){auto.current.add(proximo.id);setTemporizado(true);setAberto(proximo)}}}catch{if(!signal?.aborted&&!automatico)setErro('Não foi possível carregar os avisos. Tente novamente.')}finally{if(!signal?.aborted)setLoading(false)}}
 useEffect(()=>{const controller=new AbortController();carregar(controller.signal,true);const voltar=()=>{if(document.visibilityState==='visible')carregar(controller.signal,true)};document.addEventListener('visibilitychange',voltar);return()=>{controller.abort();document.removeEventListener('visibilitychange',voltar)}},[])
 useEffect(()=>{if(!galeria)return;const d=dialog.current;if(!d)return;const foco=document.activeElement as HTMLElement|null;d.showModal();const anterior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{d.close();document.body.style.overflow=anterior;foco?.focus()}},[galeria])
 function fechar(){const aviso=aberto;setAberto(null);if(!aviso)return;auto.current.add(aviso.id);setAvisos(a=>a.map(x=>x.id===aviso.id?{...x,fechado:true}:x));void portalApi(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:aviso.id})}).catch(()=>{setErro('O aviso foi fechado neste acesso. Não foi possível registrar o fechamento; ele poderá aparecer novamente ao entrar.')})}
 const imagem=(a:AvisoAplicativo)=>endpoint+'?imagem='+a.id
 return <><button className={styles.shortcut} onClick={()=>{setGaleria(true);carregar()}}><Bell aria-hidden="true"/><strong>Avisos do clube</strong><span>{avisos.filter(a=>!a.fechado).length?`${avisos.filter(a=>!a.fechado).length} novo(s)`:''}</span><ChevronRight aria-hidden="true"/></button>
 {erro&&<p role="status" className="socio-help">{erro}</p>}
 {galeria&&<dialog ref={dialog} className={styles.modal} aria-labelledby="galeria-avisos" onCancel={e=>{e.preventDefault();setGaleria(false)}}><header className={styles.cartazHeader}><h2 id="galeria-avisos">Avisos do clube</h2><button autoFocus className={styles.close} aria-label="Fechar lista de avisos" onClick={()=>setGaleria(false)}><X/><span>Fechar</span></button></header><div className={styles.gallery}>{loading?<p role="status">Carregando…</p>:<>{erro&&<p role="alert">{erro}</p>}{!avisos.length&&<p>Nenhum aviso ativo no momento.</p>}{avisos.map(a=><button key={a.id} onClick={()=>{setGaleria(false);setTemporizado(false);setAberto(a)}}><img src={imagem(a)} alt="" loading="lazy"/><span><strong>{a.titulo}</strong><small>{a.fechado?'Já visualizado':'Novo aviso'}</small></span></button>)}</>}</div></dialog>}
 {aberto&&<ModalAviso tempoSegundos={temporizado?tempo:0} titulo={aberto.titulo} descricao={aberto.descricao} imagem={imagem(aberto)} onClose={fechar}/>}</>
}
