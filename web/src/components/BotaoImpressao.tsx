'use client'
import {useEffect,useState} from 'react'
import {Button,ButtonProps} from '@/components/ui/button'
/** Mesmo estado para os pontos de entrada da impressão; evita disparos repetidos. */
export function BotaoImpressao({children,disabled,...props}:ButtonProps){
 const [preparando,setPreparando]=useState(false)
 useEffect(()=>{const atualizar=(e:Event)=>setPreparando((e as CustomEvent<boolean>).detail);window.addEventListener('clube-impressao-estado',atualizar);return()=>window.removeEventListener('clube-impressao-estado',atualizar)},[])
 return <Button {...props} type="button" disabled={disabled||preparando} aria-busy={preparando}>{preparando?'Preparando impressão...':children}</Button>
}
