export const normalizarCnpj=(v:string)=>v.toUpperCase().replace(/[.\/\-\s]/g,'')
export function formatarCnpj(v:string){return v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,14).replace(/^(.{2})(.)/,'$1.$2').replace(/^(.{2})\.(.{3})(.)/,'$1.$2.$3').replace(/^(.{2})\.(.{3})\.(.{3})(.)/,'$1.$2.$3/$4').replace(/\/(.{4})(.)/,'/$1-$2')}
export function cnpjValido(v:string){
 const n=normalizarCnpj(v);if(!/^[A-Z0-9]{12}\d{2}$/.test(n)||/^(.)\1{13}$/.test(n))return false
 let base=n.slice(0,12)
 for(let etapa=0;etapa<2;etapa++){
  const pesos=etapa?[6,5,4,3,2,9,8,7,6,5,4,3,2]:[5,4,3,2,9,8,7,6,5,4,3,2]
  const resto=Array.from(base).reduce((s,c,i)=>s+(c.charCodeAt(0)-48)*pesos[i],0)%11
  base+=resto<2?'0':String(11-resto)
 }
 return base===n
}
export function dadosDocumento<T extends {tipo_cadastro:string;cnpj:string;cpf:string;rg:string;titulo_eleitor:string;data_nascimento:string;nome_fantasia:string;sexo?:string}>(f:T){
 return {...f,...('sexo' in f?{sexo:f.tipo_cadastro==='pj'?null:f.sexo}:{}),cnpj:f.tipo_cadastro==='pj'?normalizarCnpj(f.cnpj):null,cpf:f.tipo_cadastro==='pj'?null:f.cpf.replace(/\D/g,''),rg:f.tipo_cadastro==='pj'?null:f.rg,titulo_eleitor:f.tipo_cadastro==='pj'?null:f.titulo_eleitor,data_nascimento:f.tipo_cadastro==='pj'?null:f.data_nascimento.trim()||null,nome_fantasia:f.tipo_cadastro==='pj'?f.nome_fantasia:null}
}
