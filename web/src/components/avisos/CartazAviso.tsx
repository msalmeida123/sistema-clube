 'use client'
import {useEffect,useRef,useState,useId} from 'react'
import {useTempoAviso} from './useTempoAviso'
import {X} from 'lucide-react'
import styles from './avisos.module.css'
export function CartazAviso({titulo,descricao,imagem,onClose,titleId,onReady}:{titulo:string;descricao:string;imagem:string;onClose?:()=>void;titleId?:string;onReady?:(ready:boolean)=>void}){
 const [falhou,setFalhou]=useState(false)
 const id=useId(),img=useRef<HTMLImageElement>(null)
 useEffect(()=>{setFalhou(false);onReady?.(!!img.current?.complete&&!!img.current?.naturalWidth)},[imagem,onReady])
 return <><header className={styles.cartazHeader}><div><span>AVISO DO CLUBE</span><h2 id={titleId||id}>{titulo}</h2></div><button type="button" className={styles.close} aria-label="Fechar aviso" onClick={onClose} disabled={!onClose} autoFocus={!!onClose}><X size={22}/><span>Fechar</span></button></header>
 <div className={styles.art}>{imagem&&!falhou?<img ref={img} src={imagem} alt={titulo} onLoad={()=>onReady?.(true)} onError={()=>{setFalhou(true);onReady?.(false)}}/>:<p>{falhou?'Não foi possível carregar a imagem. Você pode fechar o aviso e tentar novamente.':'Sua imagem aparecerá aqui'}</p>}</div>
 {descricao&&<div className={styles.description}>{descricao}</div>}</>
}
export function ModalAviso({titulo,descricao,imagem,onClose,tempoSegundos=0}:{titulo:string;descricao:string;imagem:string;onClose:()=>void;tempoSegundos?:number}){
 const ref=useRef<HTMLDialogElement>(null),id=useId()
 const [pronto,setPronto]=useState(false)
 const {restante,manter,manterAberto}=useTempoAviso(tempoSegundos,pronto,onClose)
 useEffect(()=>{const d=ref.current;if(!d)return;const anterior=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;d.showModal();document.body.style.overflow='hidden';return()=>{d.close();document.body.style.overflow=overflow;anterior?.focus()}},[])
 return <dialog ref={ref} className={styles.modal} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose()}}><CartazAviso titleId={id} titulo={titulo} descricao={descricao} imagem={imagem} onClose={onClose} onReady={setPronto}/>{tempoSegundos>0&&pronto&&!manter&&<div className={styles.timer}><span>Fecha em {restante} s</span><button type="button" onClick={manterAberto}>Manter aberto</button></div>}</dialog>
}
