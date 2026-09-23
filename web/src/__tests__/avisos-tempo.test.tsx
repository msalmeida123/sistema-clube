/** @jest-environment jsdom */
import React,{act} from 'react'
import {createRoot,Root} from 'react-dom/client'
import {useTempoAviso} from '@/components/avisos/useTempoAviso'
let root:Root,el:HTMLDivElement,manter:()=>void
const fechar=jest.fn()
function Teste({segundos=3,pronto=true}){const t=useTempoAviso(segundos,pronto,fechar);manter=t.manterAberto;return <span>{t.restante}</span>}
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;jest.useFakeTimers();fechar.mockReset();Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});el=document.createElement('div');document.body.append(el);root=createRoot(el)})
afterEach(()=>{act(()=>root.unmount());el.remove();jest.useRealTimers()})
it('fecha uma única vez no tempo configurado',()=>{act(()=>root.render(<Teste/>));act(()=>jest.advanceTimersByTime(2000));expect(fechar).not.toHaveBeenCalled();act(()=>jest.advanceTimersByTime(5000));expect(fechar).toHaveBeenCalledTimes(1)})
it('espera a imagem carregar e pausa quando oculto',()=>{act(()=>root.render(<Teste pronto={false}/>));act(()=>jest.advanceTimersByTime(9000));expect(fechar).not.toHaveBeenCalled();act(()=>root.render(<Teste/>));Object.defineProperty(document,'visibilityState',{value:'hidden'});act(()=>jest.advanceTimersByTime(9000));expect(fechar).not.toHaveBeenCalled();Object.defineProperty(document,'visibilityState',{value:'visible'});act(()=>jest.advanceTimersByTime(3000));expect(fechar).toHaveBeenCalledTimes(1)})
it('permite manter aberto',()=>{act(()=>root.render(<Teste/>));act(()=>manter());act(()=>jest.advanceTimersByTime(60000));expect(fechar).not.toHaveBeenCalled()})
it('não fecha quando automático está desativado',()=>{act(()=>root.render(<Teste segundos={0}/>));act(()=>jest.advanceTimersByTime(60000));expect(fechar).not.toHaveBeenCalled()})
it('cancela o temporizador ao sair do aviso',()=>{act(()=>root.render(<Teste/>));act(()=>root.render(null));act(()=>jest.advanceTimersByTime(60000));expect(fechar).not.toHaveBeenCalled()})
