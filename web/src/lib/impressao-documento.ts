import {reservarImpressao, SessaoImpressao} from './impressao'
import { escapeHtml } from './security'

export function dataDocumento(valor?: string | null) {
  if (!valor) return 'Não informado'
  const data = valor.slice(0,10)
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data.split('-').reverse().join('/') : 'Não informado'
}

// Conteúdo interno produzido pelo React ou por templates que escapam os dados.
export function htmlDocumento(titulo: string, conteudo: string, formato?: 'cupom80') {
  if(formato==='cupom80')return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(titulo)}</title><style>
  @page{size:80mm 110mm;margin:4mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white}body{width:72mm}article{width:72mm;margin:0}article>img{display:block;width:72mm!important;height:auto!important;margin:0 0 4mm!important;break-inside:avoid}article>img:last-child{margin-bottom:0!important}@media print{html,body,article{width:72mm!important;max-width:72mm!important}header{display:none!important}}
  </style></head><body data-carteirinha="cupom80"><article>${conteudo}</article></body></html>`
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(titulo)}</title>
  <style>
  @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:11pt/1.45 Arial,sans-serif;color:#111;background:white;margin:0}article{max-width:178mm;margin:0 auto;overflow-wrap:anywhere}p{margin:8px 0;orphans:3;widows:3}h1{font-size:16pt}h2{font-size:14pt}h3{font-size:11pt;break-after:avoid}ul{padding-left:22px}li{margin:4px 0}.text-center{text-align:center}.text-justify{text-align:justify}.font-bold,.font-semibold{font-weight:bold}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.col-span-2{grid-column:span 2}.border-t{border-top:1px solid #555;padding-top:8px}.border-b-2{border-bottom:2px solid;padding-bottom:12px}.space-y-5>*,.space-y-4>*{margin-bottom:14px}.assinaturas{break-inside:avoid;margin-top:22mm}.assinaturas p{margin:5px 0}.border{border:1px solid #ccc;padding:12px}.qrcode{text-align:center;break-inside:avoid}.qrcode img{width:45mm;height:45mm}.convite{border:2px solid #333;padding:12mm;max-width:155mm;margin:10mm auto;break-inside:avoid}.aviso{padding:12px;background:#eef2ff;text-align:center}button{padding:10px 16px;margin:8px} @media print{.aviso{display:none}article{max-width:none}.convite{margin:0 auto}}
  </style></head><body><article>${conteudo}</article>
</body></html>`
}

const documentos=new WeakMap<Window,SessaoImpressao>()
export function reservarDocumento(){const sessao=reservarImpressao();if(!sessao)return null;documentos.set(sessao.janela,sessao);return sessao.janela}
export function abrirDocumento(titulo: string, conteudo: string, janela?: Window | null, formato?: 'cupom80') {
 const sessao=janela?documentos.get(janela):reservarImpressao()
 if(!sessao)return
 void sessao.enviar(htmlDocumento(titulo,conteudo,formato)).catch(()=>{})
}
