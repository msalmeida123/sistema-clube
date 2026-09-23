export function paginacao(url: string) {
 const q=new URL(url).searchParams
 const numero=(nome:string,padrao:number,max:number)=>{const v=q.get(nome);if(v===null)return padrao;if(!/^[1-9]\d*$/.test(v)||Number(v)>max)throw Error('Paginação inválida');return Number(v)}
 const pagina=numero('pagina',1,10000),limite=numero('limite',20,100)
 return {pagina,limite,inicio:(pagina-1)*limite,fim:pagina*limite-1}
}
