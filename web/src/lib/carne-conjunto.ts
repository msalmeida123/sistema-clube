export function calcularCarneConjunto(titulo: number, mensalidade: number, quantidade: number) {
 if (![titulo,mensalidade].every(v=>Number.isFinite(v)&&v>=0) || !Number.isInteger(quantidade)||quantidade<1||quantidade>60) throw Error('Valores inválidos')
 const centavos=Math.round(titulo*100), mensalCent=Math.round(mensalidade*100)
 const parcelas=Array.from({length:quantidade},(_,i)=>{
  const valorTitulo=(Math.floor(centavos/quantidade)+(i<centavos%quantidade?1:0))/100
  return {titulo:valorTitulo,mensalidade:mensalCent/100,total:(Math.round(valorTitulo*100)+mensalCent)/100}
 })
 return {parcelas,total:(centavos+mensalCent*quantidade)/100}
}
