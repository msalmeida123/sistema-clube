'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
export type EnderecoCep={endereco:string,bairro:string,cidade:string,estado:string,ibge:string}
export function useCep(preencher:(endereco:EnderecoCep)=>void) {
 const callback=useRef(preencher);callback.current=preencher
 const controller=useRef<AbortController|null>(null)
 const [mensagemCep,setMensagem]=useState('')
 useEffect(()=>()=>controller.current?.abort(),[])
 const buscarCEP=useCallback(async(valor:string)=>{
  controller.current?.abort()
  const atual=new AbortController();controller.current=atual
  const cep=valor.replace(/\D/g,'')
  setMensagem('')
  if(cep.length!==8) return
  setMensagem('Consultando CEP...')
  try {
   const response=await fetch(`/api/cep/${cep}`,{signal:atual.signal})
   const data=await response.json()
   if(atual.signal.aborted) return
   if(!response.ok) throw Error(data.error||'Não foi possível consultar o CEP.')
   callback.current(data)
   setMensagem(data.endereco?'Endereço preenchido. Informe o número e confira os dados.':'Cidade e estado preenchidos. Complete a rua, o bairro e o número.')
  } catch(e) {
   if(!atual.signal.aborted) setMensagem(e instanceof Error ? e.message : 'Preencha o endereço manualmente.')
  }
 },[])
 return {buscarCEP,mensagemCep}
}
