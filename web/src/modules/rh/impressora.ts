export const CHAVE_IMPRESSORA_RH = 'rh-impressao-v1'
export type ImpressaoRH = { margem: number }
export function lerImpressaoRH(): ImpressaoRH {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_IMPRESSORA_RH) || '{}')
    if (Number.isInteger(valor?.margem) && valor.margem >= 5 && valor.margem <= 25) return { margem: valor.margem }
  } catch { /* Usar o padrão quando o armazenamento estiver indisponível. */ }
  return { margem: 16 }
}
export function estiloImpressaoRH() {
  const { margem } = lerImpressaoRH()
  return `<style>@page{size:A4 portrait;margin:${margem}mm}@media print{article{max-width:none}}</style>`
}
