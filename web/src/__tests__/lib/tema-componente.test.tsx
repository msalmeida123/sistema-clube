/** @jest-environment jsdom */
import React,{act} from 'react'
import {createRoot,Root} from 'react-dom/client'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import Configuracao from '@/components/ConfiguracaoPersonalizacao'
import {buscarTema} from '@/components/providers/tema-provider'
import {padrao} from '@/lib/tema/modelo'
jest.mock('@/components/providers/tema-provider',()=>({buscarTema:jest.fn(),publicarTema:jest.fn()}))
let div:HTMLDivElement,root:Root
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;div=document.createElement('div');document.body.append(div);root=createRoot(div);(buscarTema as jest.Mock).mockResolvedValue({cores:padrao,versao:0,icone:false,personalizado:false})})
afterEach(async()=>{await act(async()=>root.unmount());div.remove();jest.clearAllMocks()})
async function montar(){await act(async()=>root.render(<QueryClientProvider client={new QueryClient()}><Configuracao/></QueryClientProvider>))}
function button(label:string){return Array.from(document.querySelectorAll('button')).find(b=>b.textContent===label)!}
async function click(label:string){await act(async()=>button(label).click())}
test('rótulos, três prévias e rascunho não provocam salvamento',async()=>{await montar();expect(div.querySelectorAll('input[type=color]')).toHaveLength(9);for(const input of Array.from(div.querySelectorAll('input[type=text]')))expect(div.querySelector(`label[for="${input.id}"]`)).not.toBeNull();await click('Tablet');expect(button('Tablet').getAttribute('aria-pressed')).toBe('true');await click('Celular');expect((div.querySelector('[data-testid=tema-preview]') as HTMLElement).style.maxWidth).toBe('320px');expect(buscarTema).toHaveBeenCalledTimes(1)})
test('restauração exige confirmação e não salva automaticamente',async()=>{await montar();await click('Restaurar cores padrão');expect(document.querySelector('[role=alertdialog]')).not.toBeNull();await click('Restaurar cores');expect(div.textContent).toContain('Cores padrão na prévia');expect(buscarTema).toHaveBeenCalledTimes(1)})
test('erro no salvamento mantém campos, e cancelar recarrega salvo',async()=>{await montar();(buscarTema as jest.Mock).mockRejectedValueOnce(new Error('Falha temporária'));await click('Salvar alterações');expect(div.querySelector('[role=alert]')?.textContent).toBe('Falha temporária');expect((div.querySelector('#hex-primaria') as HTMLInputElement).value).toBe(padrao.primaria);await click('Cancelar');expect(div.querySelector('[role=alert]')).toBeNull()})
test('dois cliques durante o salvamento fazem uma única requisição',async()=>{await montar();let resolver:(value:any)=>void=()=>{};(buscarTema as jest.Mock).mockImplementationOnce(()=>new Promise(resolve=>{resolver=resolve}));await act(async()=>{button('Salvar alterações').click();button('Salvar alterações').click()});expect(buscarTema).toHaveBeenCalledTimes(2);expect(button('Salvando…').disabled).toBe(true);await act(async()=>resolver({cores:padrao,versao:1,icone:false,personalizado:true}));expect(div.textContent).toContain('Personalização salva e aplicada ao clube.')})
