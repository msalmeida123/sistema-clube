/** @jest-environment jsdom */
import React, {useContext} from 'react'
import {createRoot} from 'react-dom/client'
import {act} from 'react-dom/test-utils'
import {PermissoesProvider, PermissoesContext} from '@/modules/auth/components/PermissoesProvider'

const mockRpc=jest.fn()
const mockClient={auth:{getUser:async()=>({data:{user:{id:'user'}}})},rpc:mockRpc}
jest.mock('@/lib/supabase/client',()=>({createClientComponentClient:()=>mockClient}))
jest.mock('@/lib/usuario-atual',()=>({buscarUsuarioAtual:async()=>({ativo:true,is_admin:false})}))
jest.mock('@/modules/auth/repositories/permissoes.repository',()=>({findPaginas:async()=>[{id:'rh',codigo:'rh'}]}))

function FormularioProtegido(){
 const p=useContext(PermissoesContext)!
 if(p.loading)return <span>Carregando</span>
 if(!p.podeVisualizar('rh'))return <span>Sem acesso</span>
 return <input aria-label="Quinzena" defaultValue=""/>
}

test('atualizar permissões por foco ou timer preserva o campo; revogação continua bloqueando',async()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true
 jest.useFakeTimers()
 const host=document.createElement('div');document.body.appendChild(host)
 const root=createRoot(host)
 const permitido={data:[{id:'rh',pode_visualizar:true}],error:null}
 mockRpc.mockResolvedValue(permitido)
 try{
  await act(async()=>{root.render(<PermissoesProvider><FormularioProtegido/></PermissoesProvider>)})
  const input=host.querySelector('input')!;expect(input).not.toBeNull();input.value='500.00'
  for(const evento of ['foco','timer']){
   let resolver!:(value:any)=>void
   mockRpc.mockImplementationOnce(()=>new Promise(resolve=>{resolver=resolve}))
   await act(async()=>{if(evento==='foco')window.dispatchEvent(new Event('focus'));else jest.advanceTimersByTime(15000)})
   expect(host.querySelector('input')).toBe(input)
   await act(async()=>{resolver(permitido)})
   expect(host.querySelector('input')).toBe(input)
   expect(input.value).toBe('500.00')
  }
  mockRpc.mockResolvedValueOnce({data:[],error:null})
  await act(async()=>{window.dispatchEvent(new Event('focus'))})
  expect(host.querySelector('input')).toBeNull()
  expect(host.textContent).toBe('Sem acesso')
 }finally{await act(async()=>root.unmount());host.remove();jest.useRealTimers()}
})
