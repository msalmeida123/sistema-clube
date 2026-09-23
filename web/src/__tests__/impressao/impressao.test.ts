/** @jest-environment jsdom */
import {prepararHtmlImpressao,reservarImpressao,POPUP_BLOQUEADO} from '@/lib/impressao'
import {runtimeImpressao} from '@/lib/impressao-runtime'
import {toast} from 'sonner'
jest.mock('sonner',()=>({toast:{error:jest.fn(),info:jest.fn()}}))
describe('janela de impressão',()=>{
 afterEach(()=>{jest.restoreAllMocks();jest.useRealTimers()})
 test('popup bloqueado mantém documento e informa como autorizar',()=>{
  document.body.innerHTML='<main>Filtros mantidos</main>';const html=document.body.innerHTML
  jest.spyOn(window,'open').mockReturnValue(null)
  expect(reservarImpressao()).toBeNull();expect(document.body.innerHTML).toBe(html)
  expect(toast.error).toHaveBeenCalledWith(POPUP_BLOQUEADO)
 })
 test('abre rota imediatamente; bloqueia duplicação e limpa somente a janela temporária',()=>{
  jest.useFakeTimers();const close=jest.fn(),focus=jest.fn();const child={close,focus,closed:false} as unknown as Window
  const open=jest.spyOn(window,'open').mockReturnValue(child)
  const sessao=reservarImpressao()!;expect(open).toHaveBeenCalledWith(expect.stringMatching(/^\/impressao#/),'_blank')
  expect(reservarImpressao()).toBeNull();expect(open).toHaveBeenCalledTimes(1)
  sessao.cancelar();expect(close).toHaveBeenCalledTimes(1)
 })
 test('nega permissão e fecha temporária sem trocar página principal',async()=>{
  const child={close:jest.fn(),closed:false} as unknown as Window;jest.spyOn(window,'open').mockReturnValue(child)
  global.fetch=jest.fn().mockResolvedValue({ok:false,status:403});Object.defineProperty(AbortSignal,'timeout',{configurable:true,value:()=>undefined})
  const antes=location.href;const sessao=reservarImpressao()!;await expect(sessao.enviar('<h1>Privado</h1>')).rejects.toThrow()
  expect(child.close).toHaveBeenCalled();expect(location.href).toBe(antes)
 })
 test('falha de rede fecha janela e permite tentar novamente',async()=>{
  const child={close:jest.fn(),closed:false} as unknown as Window;jest.spyOn(window,'open').mockReturnValue(child)
  global.fetch=jest.fn().mockRejectedValue(Error('offline'));const sessao=reservarImpressao()!;await expect(sessao.enviar('x')).rejects.toThrow('offline');expect(child.close).toHaveBeenCalled()
  const nova=reservarImpressao();expect(nova).not.toBeNull();nova?.cancelar()
 })
})
describe('documento para papel',()=>{
 test('A4 retrato, tabela vazia legível e sem código executável',()=>{
  const html=prepararHtmlImpressao('<script>alert(1)</script><img src="x" onerror="alert(1)"><table><thead><tr><th>Nome</th></tr></thead><tbody></tbody></table>')
  expect(html).not.toContain('<script');expect(html).not.toContain('onerror');expect(html).toContain('A4 portrait');expect(html).toContain('Nenhum registro encontrado');expect(html).toContain('table-header-group');expect(html).toContain('counter(page)')
 })
 test('muitas colunas escolhem paisagem e linhas não quebram entre páginas',()=>{
  const html=prepararHtmlImpressao('<table><thead><tr>'+Array(7).fill('<th>Coluna</th>').join('')+'</tr></thead><tbody>'+Array(200).fill('<tr><td>Registro</td></tr>').join('')+'</tbody></table>')
  expect(html).toContain('A4 landscape');expect(html).toContain('page-break-inside:avoid');expect((html.match(/<td>Registro/g)||[])).toHaveLength(200)
 })
 test('preserva largura térmica',()=>{
  const html=prepararHtmlImpressao('<style>@page{size:80mm 297mm;margin:4mm}</style><p>Comanda</p>');expect(html).toContain('size:80mm');expect(html).not.toContain('size:A4')
 })
})
describe('recursos e afterprint',()=>{
 test('só aceita mensagem do opener, imprime no iframe e fecha após cancelar/imprimir',async()=>{
  document.body.innerHTML='<p id="estado"></p><button id="imprimir"></button><button id="fechar"></button><div id="relatorio"></div>'
  const opener={postMessage:jest.fn()};Object.defineProperty(window,'opener',{configurable:true,value:opener})
  history.replaceState(null,'','#teste');const close=jest.spyOn(window,'close').mockImplementation(()=>{})
  runtimeImpressao()
  window.dispatchEvent(new MessageEvent('message',{origin:location.origin,source:opener as any,data:{canal:'clube-impressao',id:'teste',tipo:'documento',html:'<p>Relatório</p>',automatico:false}}))
  const frame=document.querySelector('iframe')!;expect(frame.getAttribute('sandbox')).toBe('allow-same-origin allow-modals')
  const fonts={ready:Promise.resolve()};Object.defineProperty(frame.contentDocument!,'fonts',{configurable:true,value:fonts})
  const print=jest.spyOn(frame.contentWindow!,'print').mockImplementation(()=>{});jest.spyOn(frame.contentWindow!,'focus').mockImplementation(()=>{})
  jest.spyOn(window,'requestAnimationFrame').mockImplementation(cb=>{cb(0);return 1})
  frame.dispatchEvent(new Event('load'));(document.getElementById('imprimir') as HTMLButtonElement).click()
  await new Promise(r=>setTimeout(r,0));expect(print).toHaveBeenCalledTimes(1);expect(close).not.toHaveBeenCalled()
  frame.contentWindow!.dispatchEvent(new Event('afterprint'));expect(close).toHaveBeenCalledTimes(1)
 })
})

test('carteirinha térmica preserva papel 80 mm sem regras A4 nem paginação',()=>{
 const {htmlDocumento}=require('@/lib/impressao-documento')
 const html=prepararHtmlImpressao(htmlDocumento('Carteirinha','<img src="data:image/png;base64,AA==" style="width:85.6mm;height:54mm">','cupom80'))
 expect(html).toContain('size:80mm 110mm');expect(html).toContain('width:72mm!important');expect(html).not.toContain('size:A4');expect(html).not.toContain('@bottom-right');expect(html).toContain('data-carteirinha="cupom80"')
})
