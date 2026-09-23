'use client'
import {createContext,useContext,useEffect} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {usePathname} from 'next/navigation'
import {Tema,temaPadrao,variaveis} from '@/lib/tema/modelo'
const Context=createContext<Tema>(temaPadrao)
export async function buscarTema(url='/api/tema',options?:RequestInit):Promise<Tema>{const response=await fetch(url,{...options,credentials:'same-origin',cache:'no-store'});if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('O serviço está indisponível. Tente novamente.');const data=await response.json();if(!response.ok)throw new Error(response.status===401?'Entre novamente para continuar.':typeof data.error==='string'&&data.error.length<220?data.error:'Não foi possível carregar a personalização.');return data}
export function TemaProvider({children}:{children:React.ReactNode}){const client=useQueryClient(),path=usePathname();const {data:tema=temaPadrao}=useQuery({queryKey:['tema-aplicativo'],queryFn:()=>buscarTema(),staleTime:60000,retry:1,refetchOnWindowFocus:true,refetchInterval:60000});
 useEffect(()=>{if(path==='/login'||path==='/associado')client.invalidateQueries({queryKey:['tema-aplicativo']})},[path,client]);
 useEffect(()=>{const listener=()=>client.invalidateQueries({queryKey:['tema-aplicativo']});const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('tema-aplicativo'):null;if(channel)channel.onmessage=listener;window.addEventListener('tema-atualizado',listener);return()=>{channel?.close();window.removeEventListener('tema-atualizado',listener)}},[client]);
 useEffect(()=>{const root=document.documentElement;const vars=variaveis(tema.cores);if(tema.personalizado){for(const[k,v]of Object.entries(vars))root.style.setProperty(k,v);root.dataset.tema='personalizado'}else{for(const k of Object.keys(vars))root.style.removeProperty(k);delete root.dataset.tema}
 for(const [rel,size] of [['icon',32],['apple-touch-icon',180]] as const){let link=document.head.querySelector<HTMLLinkElement>(`link[data-tema="${rel}"]`);if(!link){link=document.createElement('link');link.rel=rel;link.dataset.tema=rel;document.head.append(link)}const href=`/api/tema/icone?size=${size}&v=${tema.versao}`;if(link.getAttribute('href')!==href)link.href=href}
 let meta=document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.append(meta)}meta.content=tema.personalizado?tema.cores.cabecalho:'#103f35';
 },[tema]);return <Context.Provider value={tema}>{children}</Context.Provider>}
export function IconeClube({className='h-8 w-8'}:{className?:string}){const tema=useContext(Context);return <img className={`${className} shrink-0 object-contain`} src={`/api/tema/icone?size=192&v=${tema.versao}`} alt="Ícone do clube" width={32} height={32}/>}
export function publicarTema(){window.dispatchEvent(new Event('tema-atualizado'));if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel('tema-aplicativo');c.postMessage('atualizar');c.close()}}
