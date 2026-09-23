/** Cache local limitado: somente dados públicos, nunca sessões ou decisões de acesso. */
export class CacheMemoria<T> {
 private valores=new Map<string,{valor:T;expira:number}>()
 private pendentes=new Map<string,Promise<T>>()
 constructor(private ttl:number,private limite=500){}
 limpar(){this.valores.clear()}
 async obter(chave:string,carregar:()=>Promise<T>):Promise<T>{
  const atual=this.valores.get(chave)
  if(atual&&atual.expira>Date.now())return atual.valor
  this.valores.delete(chave)
  const pendente=this.pendentes.get(chave);if(pendente)return pendente
  // Não guardar novas chaves quando há muitas consultas simultâneas.
  if(this.pendentes.size>=this.limite)return carregar()
  const promessa=Promise.resolve().then(carregar).then(valor=>{
   while(this.valores.size>=this.limite)this.valores.delete(this.valores.keys().next().value!)
   this.valores.set(chave,{valor,expira:Date.now()+this.ttl});return valor
  }).finally(()=>this.pendentes.delete(chave))
  this.pendentes.set(chave,promessa);return promessa
 }
}
