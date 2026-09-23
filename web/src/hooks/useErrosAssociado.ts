'use client'
import {useRef,useState} from 'react'
import {erroCampoAssociado,campoErroBancoAssociado} from '@/lib/validacao-associado'
export function useErrosAssociado(){
 const formRef=useRef<HTMLFormElement>(null)
 const [erros,setErros]=useState<Record<string,string>>({})
 const [erroGeral,setErroGeral]=useState('')
 function validar(el:HTMLInputElement|HTMLSelectElement){if(el.validity.valueMissing)return 'Preencha este campo obrigatório.';return erroCampoAssociado(el.name,el.value,el.validity.badInput)||(!el.validity.valid?'Confira o valor deste campo.':'')}
 function focar(nome:string){const el=formRef.current?.elements.namedItem(nome);if(el instanceof HTMLElement){el.focus();el.scrollIntoView({block:'center',behavior:'smooth'})}}
 function validarTudo(){
  const novos:Record<string,string>={}
  for(const el of Array.from(formRef.current?.elements||[]))if((el instanceof HTMLInputElement||el instanceof HTMLSelectElement)&&el.name){const msg=validar(el);if(msg)novos[el.name]=msg}
  setErros(novos);setErroGeral('')
  const primeiro=Object.keys(novos)[0];if(primeiro){focar(primeiro);return false}return true
 }
 function revisar(e:React.SyntheticEvent<HTMLFormElement>,sempre=false){
  const el=e.target
  if((el instanceof HTMLInputElement||el instanceof HTMLSelectElement)&&el.name&&(sempre||erros[el.name]))setErros(prev=>({...prev,[el.name]:validar(el)}))
 }
 function erroServidor(error:unknown){
  const detalhe=campoErroBancoAssociado(error)
  if(detalhe){setErros(prev=>({...prev,[detalhe.campo]:detalhe.mensagem}));focar(detalhe.campo)}
  else setErroGeral('Não foi possível salvar. Tente novamente; se o problema continuar, procure o administrador.')
 }
 return {formRef,erros,erroGeral,validarTudo,erroServidor,onBlurCapture:(e:React.SyntheticEvent<HTMLFormElement>)=>revisar(e,true),onChangeCapture:(e:React.SyntheticEvent<HTMLFormElement>)=>revisar(e)}
}
