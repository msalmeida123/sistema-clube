/** @jest-environment jsdom */
import React,{act} from 'react'
import {createRoot,Root} from 'react-dom/client'
import {FundoLogin} from '@/components/FundoLogin'
let div:HTMLDivElement,root:Root
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;div=document.createElement('div');document.body.append(div);root=createRoot(div)})
afterEach(async()=>{await act(async()=>root.unmount());div.remove();jest.restoreAllMocks()})
async function montar(complete:boolean,width:number){jest.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(complete);jest.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(width);await act(async()=>root.render(<FundoLogin/>));return div.querySelector('img')!}
it('exibe imagem que carregou antes da hidratação registrar onLoad',async()=>{const img=await montar(true,1920);expect(img.classList.contains('hidden')).toBe(false)})
it('mantém fundo padrão quando não há imagem válida',async()=>{const img=await montar(true,0);expect(img.classList.contains('hidden')).toBe(true)})
it('exibe imagem carregada depois da montagem e trata falhas',async()=>{const img=await montar(false,0);await act(async()=>{img.dispatchEvent(new Event('load'))});expect(img.classList.contains('hidden')).toBe(false);await act(async()=>{img.dispatchEvent(new Event('error'))});expect(img.classList.contains('hidden')).toBe(true)})
