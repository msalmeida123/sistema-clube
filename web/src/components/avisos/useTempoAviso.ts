'use client'
import {useEffect,useRef,useState} from 'react'
/** Conta apenas segundos visíveis depois que o cartaz carrega. */
export function useTempoAviso(segundos:number,pronto:boolean,onClose:()=>void){
 const [restante,setRestante]=useState(segundos),[manter,setManter]=useState(false)
 const fechar=useRef(onClose);fechar.current=onClose
 useEffect(()=>{setRestante(segundos)},[segundos])
 useEffect(()=>{
  if(!pronto||manter||segundos<1||segundos>60)return
  let faltam=segundos,disparou=false
  const id=setInterval(()=>{if(document.visibilityState==='hidden'||disparou)return;faltam-=1;setRestante(faltam);if(faltam<=0){disparou=true;clearInterval(id);fechar.current()}},1000)
  return()=>clearInterval(id)
 },[segundos,pronto,manter])
 return {restante,manter,manterAberto:()=>setManter(true)}
}
