import {toast} from 'sonner'
export const POPUP_BLOQUEADO='Não foi possível abrir a impressão. Autorize pop-ups para este sistema e tente novamente.'
const FALHA='Não foi possível preparar a impressão. Tente novamente.'
export type SessaoImpressao={janela:Window;enviar:(html:string,automatico?:boolean)=>Promise<void>;cancelar:()=>void}
let atual:SessaoImpressao|null=null
export function prepararHtmlImpressao(html:string){
 const doc=new DOMParser().parseFromString(html,'text/html')
 doc.querySelectorAll('script,base,meta[http-equiv],iframe,object,embed,form').forEach(e=>e.remove())
 doc.querySelectorAll('*').forEach(el=>Array.from(el.attributes).forEach(a=>{if(/^on/i.test(a.name)||a.name==='srcdoc'||(/^(href|src|action)$/i.test(a.name)&&/^\s*javascript:/i.test(a.value)))el.removeAttribute(a.name)}))
 const estilo=doc.createElement('style')
 const termico=/@page\s*\{[^}]*size:\s*(58|80)mm/i.test(html)
 const paisagem=Array.from(doc.querySelectorAll('thead tr')).some(tr=>tr.children.length>=6)
 estilo.textContent=`@page{${termico?'':'size:A4 '+(paisagem?'landscape':'portrait')+';margin:12mm;'}${termico?'':'@bottom-right{content:"Página " counter(page) " de " counter(pages);font-size:9pt}'}}@media print{html,body{height:auto!important;overflow:visible!important;margin:0!important;padding:0!important;background:white!important;color:#111!important}button,nav,aside,input,select,textarea,.no-print,.aviso,[class~="print:hidden"]{display:none!important}article,main,.container{max-width:none!important;width:auto!important;margin:0!important;padding:0!important}.section{break-inside:auto!important}table{width:100%!important;border-collapse:collapse;table-layout:auto}thead{display:table-header-group}tfoot{display:table-footer-group}tr,.parcela,.assinaturas{break-inside:avoid;page-break-inside:avoid}th,td{color:#111!important;border:1px solid #bbb!important;overflow-wrap:anywhere}th,.header,.header *{background:white!important;color:#111!important}h1,h2,h3{break-after:avoid}p{orphans:3;widows:3}.clube-table-scroll{overflow:visible!important}img{max-width:100%}}`
 doc.head.appendChild(estilo)
 doc.querySelectorAll('tbody').forEach(body=>{if(!body.children.length){const tr=doc.createElement('tr'),td=doc.createElement('td');td.colSpan=body.closest('table')?.querySelectorAll('thead th').length||1;td.textContent='Nenhum registro encontrado para os filtros selecionados.';tr.appendChild(td);body.appendChild(tr)}})
 return '<!doctype html>'+doc.documentElement.outerHTML
}
export function reservarImpressao():SessaoImpressao|null{
 if(atual&&!atual.janela.closed){toast.info('Já existe uma impressão em preparação.');atual.janela.focus();return null}
 const id=crypto.randomUUID(),origin=location.origin
 const janela=window.open('/impressao#'+id,'_blank')
 if(!janela||janela===window){toast.error(POPUP_BLOQUEADO);return null}
 window.dispatchEvent(new CustomEvent('clube-impressao-estado',{detail:true}))
 let aberto=false,resolveAberto:()=>void
 const pronto=new Promise<void>(r=>{resolveAberto=r})
 const listener=(e:MessageEvent)=>{if(e.origin!==origin||e.source!==janela||e.data?.id!==id||e.data?.canal!=='clube-impressao')return;if(e.data.tipo==='aberto'){aberto=true;resolveAberto()}if(['pronto','imprimindo'].includes(e.data.tipo))window.dispatchEvent(new CustomEvent('clube-impressao-estado',{detail:false}));if(e.data.tipo==='erro'){toast.error(FALHA);limpar()}if(e.data.tipo==='concluido')limpar()}
 const limpar=()=>{window.dispatchEvent(new CustomEvent('clube-impressao-estado',{detail:false}));window.removeEventListener('message',listener);clearInterval(monitor);if(atual===sessao)atual=null}
 const monitor=setInterval(()=>{if(janela.closed)limpar()},1000)
 window.addEventListener('message',listener)
 const sessao:SessaoImpressao={janela,cancelar(){janela.close();limpar()},async enviar(html,automatico=true){let timeout:ReturnType<typeof setTimeout>|undefined;try{
   const resposta=await fetch('/api/impressao/autorizar?rota='+encodeURIComponent(location.pathname),{cache:'no-store',signal:AbortSignal.timeout(30000)})
   if(!resposta.ok)throw Error('permission '+resposta.status)
   if(!aberto)await Promise.race([pronto,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('window timeout')),30000)})])
   if(janela.closed)throw Error('window closed')
   const {clube}=await resposta.json()
   const doc=new DOMParser().parseFromString(html,'text/html')
   if(clube?.nome_clube&&doc.body.dataset.carteirinha!=='cupom80'){const cabecalho=doc.createElement('header');cabecalho.style.cssText='border-bottom:1px solid #777;padding:8px 0;margin-bottom:12px;color:#111;background:white';cabecalho.textContent=clube.nome_clube+' · '+new Date().toLocaleString('pt-BR');if(clube.logo_url&&/^https?:\/\//.test(clube.logo_url)){const img=doc.createElement('img');img.src=clube.logo_url;img.alt='Logotipo do clube';img.style.cssText='max-width:120px;max-height:60px;display:block';cabecalho.prepend(img)}doc.body.prepend(cabecalho)}
   const documento=prepararHtmlImpressao(doc.documentElement.outerHTML)
   janela.postMessage({canal:'clube-impressao',id,tipo:'documento',html:documento,titulo:new DOMParser().parseFromString(documento,'text/html').title,automatico},origin)
 }catch(e){console.error('Falha na impressão',e);sessao.cancelar();toast.error(FALHA);throw e}finally{clearTimeout(timeout)}}}
 atual=sessao;return sessao
}
export async function imprimirHtml(html:string,automatico=true){const sessao=reservarImpressao();if(sessao)await sessao.enviar(html,automatico)}
export function imprimirPagina(){
 const sessao=reservarImpressao();if(!sessao)return
 const conteudo=document.querySelector('main')?.cloneNode(true) as HTMLElement|undefined
 if(!conteudo){sessao.cancelar();toast.error(FALHA);return}
 const filtros=Array.from(document.querySelectorAll('main input[type=date],main select')).map(e=>{const el=e as HTMLInputElement|HTMLSelectElement;return el instanceof HTMLSelectElement?el.selectedOptions[0]?.text:el.value}).filter(Boolean)
 if(filtros.length){const p=document.createElement('p');p.textContent='Filtros aplicados: '+filtros.join(' · ');conteudo.prepend(p)}
 conteudo.querySelectorAll('button,input,select,textarea,nav,aside,[class~="print:hidden"]').forEach(e=>e.remove())
 const estilos=Array.from(document.querySelectorAll('style,link[rel="stylesheet"]')).map(e=>e.outerHTML).join('')
 void sessao.enviar(`<!doctype html><html><head><title>${document.title}</title>${estilos}</head><body>${conteudo.outerHTML}</body></html>`).catch(()=>{})
}

export async function imprimirUrl(url:string){
 const sessao=reservarImpressao();if(!sessao)return
 try{const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('Falha no comprovante');await sessao.enviar(await r.text())}
 catch(e){console.error('Falha ao carregar comprovante',e);sessao.cancelar();toast.error(FALHA)}
}
