/** @jest-environment jsdom */
import React,{act} from 'react'
import {createRoot,Root} from 'react-dom/client'
import {MensagensClube} from '@/components/MensagensClube'
import {AvisoMensagens} from '@/components/AvisoMensagens'
import {portalApi} from '@/lib/portal-api'
jest.mock('@/lib/portal-api',()=>({...jest.requireActual('@/lib/portal-api'),portalApi:jest.fn()}))
jest.mock('@/components/NotificacoesClube',()=>({NotificacoesClube:()=>null}))
jest.mock('next/link',()=>({__esModule:true,default:({children,...p}:any)=><a {...p}>{children}</a>}))
jest.mock('@/components/mensagens-clube.css',()=>({}))
// Casos unitários isolados: nenhum cadastro, envio ou substituição de dados no portal.
const ids=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002']
let div:HTMLDivElement,root:Root,reads:Set<string>,patches:number,hold:(()=>void)|null
beforeEach(()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true
 div=document.createElement('div');document.body.append(div);root=createRoot(div);reads=new Set();patches=0;hold=null
 Object.defineProperty(document,'hidden',{configurable:true,value:false})
 ;(portalApi as jest.Mock).mockImplementation(async(url:string,init:any={})=>{
  if(init.method==='PATCH'){patches++;const chosen=JSON.parse(init.body).ids;await new Promise<void>(resolve=>{hold=()=>resolve()});chosen.forEach((id:string)=>reads.add(id));return{ids:chosen,nao_lidas:2-reads.size}}
  if(url.includes('resumo'))return{nao_lidas:2-reads.size}
  return{associado:{nome:'Conta do teste unitário'},mensagens:ids.map(id=>({id,texto:'Conteúdo do caso unitário',remetente_tipo:'equipe',criado_em:'2026-01-01T12:00:00Z',lida:reads.has(id)})),mais:false}
 })
})
afterEach(async()=>{await act(async()=>root.unmount());div.remove();jest.clearAllMocks()})
async function montar(){await act(async()=>{root.render(<><AvisoMensagens tipo="associado" onClick={()=>{}}/><MensagensClube tipo="associado"/></>)})}
function click(el:Element){el.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
async function confirmar(){await act(async()=>{hold?.();await Promise.resolve()})}
const sino=()=>div.querySelector('.clube-mensagens-atalho')!
test('abrir a página não marca; clique duplo confirma só uma mensagem e atualiza sino',async()=>{
 await montar();expect(patches).toBe(0);expect(sino().getAttribute('aria-label')).toBe('Mensagens: 2 não lidas')
 const msg=div.querySelector('article')!
 await act(async()=>{click(msg);click(msg)})
 expect(patches).toBe(1);expect(sino().textContent).toBe('2')
 await confirmar();expect(sino().getAttribute('aria-label')).toBe('Mensagens: 1 não lida')
 await act(async()=>click(msg));expect(patches).toBe(1)
 await act(async()=>click(div.querySelectorAll('article')[1]));await confirmar()
 expect(sino().getAttribute('aria-label')).toBe('Mensagens: 0 não lidas');expect(sino().querySelector('span')).toBeNull()
})
test('marcar todas usa somente ids exibidos; remontagem mantém leituras do backend',async()=>{
 await montar();const all=Array.from(div.querySelectorAll('button')).find(b=>b.textContent?.startsWith('Marcar estas'))!
 await act(async()=>click(all));await confirmar();expect(reads.size).toBe(2);expect(sino().querySelector('span')).toBeNull()
 await act(async()=>root.render(<></>));await montar();expect(div.querySelectorAll('article[role=button]')).toHaveLength(0);expect(sino().querySelector('span')).toBeNull()
})
test('mensagem pode ser aberta por teclado',async()=>{
 await montar();await act(async()=>{div.querySelector('article')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))});await confirmar();expect(reads.size).toBe(1)
})
test('resumo antigo em voo não restaura contador depois de leitura',async()=>{
 const original=(portalApi as jest.Mock).getMockImplementation()!
 let antigo:((v:any)=>void)|undefined,primeiro=true
 ;(portalApi as jest.Mock).mockImplementation((url,init)=>{if(url.includes('resumo')&&primeiro){primeiro=false;return new Promise(resolve=>{antigo=resolve})}return original(url,init)})
 await montar();await act(async()=>click(div.querySelector('article')!));await confirmar();expect(sino().getAttribute('aria-label')).toBe('Mensagens: 1 não lida')
 await act(async()=>antigo?.({nao_lidas:2}));expect(sino().getAttribute('aria-label')).toBe('Mensagens: 1 não lida')
})
test('falha ao marcar preserva não lida e o contador',async()=>{
 const original=(portalApi as jest.Mock).getMockImplementation()!
 ;(portalApi as jest.Mock).mockImplementation((url,init)=>init?.method==='PATCH'?Promise.reject(Error('detalhe interno')):original(url,init))
 await montar();await act(async()=>click(div.querySelector('article')!));expect(sino().textContent).toBe('2');expect(div.querySelector('[role=alert]')?.textContent).not.toContain('interno');expect(div.querySelectorAll('article[role=button]')).toHaveLength(2)
})
