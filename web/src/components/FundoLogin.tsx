 'use client'
import {useEffect,useRef,useState} from 'react'
/** Fundo decorativo. Erros ou ausência de imagem preservam o fundo padrão e o formulário. */
export function FundoLogin({className}:{className?:string}){
 const [visivel,setVisivel]=useState(false)
 const imagem=useRef<HTMLImageElement>(null)
 // A imagem pode terminar de carregar antes da hidratação registrar onLoad.
 useEffect(()=>{if(imagem.current?.complete)setVisivel(imagem.current.naturalWidth>0)},[])
 return <div aria-hidden="true" className={className||"absolute inset-0 pointer-events-none overflow-hidden"}>
 <img ref={imagem} src="/api/tema/fundo-login" alt="" onLoad={()=>setVisivel(true)} onError={()=>setVisivel(false)} className={`h-full w-full object-cover object-center ${visivel?'':'hidden'}`}/>
 {visivel&&<div className="absolute inset-0 bg-black/10"/>}
 </div>
}
