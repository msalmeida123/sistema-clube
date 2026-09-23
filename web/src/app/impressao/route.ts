import {runtimeImpressao} from '@/lib/impressao-runtime'
export const dynamic='force-dynamic'
export function GET(){
 return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preparando impressão</title><style>body{margin:16px;font:16px system-ui;color:#111;background:white}button{min-height:44px;padding:8px 16px;margin:4px}button:focus-visible{outline:3px solid #2459d3}@media print{header{display:none}}</style></head><body><header><p id="estado" role="status">Preparando impressão...</p><button id="imprimir" type="button" disabled>Imprimir / Salvar como PDF</button><button id="fechar" type="button">Fechar relatório</button></header><div id="relatorio"></div><script>(${runtimeImpressao.toString()})()</script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'same-origin'}})
}
