import { escapeHtml } from './security'

export function dataDocumento(valor?: string | null) {
  if (!valor) return 'Não informado'
  const data = valor.slice(0,10)
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data.split('-').reverse().join('/') : 'Não informado'
}

// Conteúdo interno produzido pelo React ou por templates que escapam os dados.
export function htmlDocumento(titulo: string, conteudo: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(titulo)}</title>
  <style>
  @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:11pt/1.45 Arial,sans-serif;color:#111;background:white;margin:0}article{max-width:178mm;margin:0 auto;overflow-wrap:anywhere}p{margin:8px 0;orphans:3;widows:3}h1{font-size:16pt}h2{font-size:14pt}h3{font-size:11pt;break-after:avoid}ul{padding-left:22px}li{margin:4px 0}.text-center{text-align:center}.text-justify{text-align:justify}.font-bold,.font-semibold{font-weight:bold}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.col-span-2{grid-column:span 2}.border-t{border-top:1px solid #555;padding-top:8px}.border-b-2{border-bottom:2px solid;padding-bottom:12px}.space-y-5>*,.space-y-4>*{margin-bottom:14px}.assinaturas{break-inside:avoid;margin-top:22mm}.assinaturas p{margin:5px 0}.border{border:1px solid #ccc;padding:12px}.qrcode{text-align:center;break-inside:avoid}.qrcode img{width:45mm;height:45mm}.convite{border:2px solid #333;padding:12mm;max-width:155mm;margin:10mm auto;break-inside:avoid}.aviso{padding:12px;background:#eef2ff;text-align:center}button{padding:10px 16px;margin:8px} @media print{.aviso{display:none}article{max-width:none}.convite{margin:0 auto}}
  </style></head><body><div class="aviso"><button onclick="window.print()">Imprimir / Salvar em PDF</button><p>Escolha a impressora de documentos ou “Salvar como PDF”. Papel A4.</p></div><article>${conteudo}</article></body></html>`
}

export function abrirDocumento(titulo: string, conteudo: string, janela?: Window | null) {
  const win = janela || window.open('', '_blank')
  if (!win) throw new Error('Permita abrir novas janelas para visualizar a impressão.')
  win.document.open()
  win.document.write(htmlDocumento(titulo, conteudo))
  win.document.close()
  win.focus()
}
