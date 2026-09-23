import {hash,verify,argon2id} from 'argon2'
import {scrypt as scryptCb,timingSafeEqual} from 'node:crypto'
import {promisify} from 'node:util'
const scrypt=promisify(scryptCb)
const legado=/^[a-f0-9]{32}:[a-f0-9]{128}$/
export function senhaLegada(valor?:string|null){return !!valor&&legado.test(valor)}
export async function hashSenha(senha:string){
 return hash(senha,{type:argon2id,memoryCost:65536,timeCost:3,parallelism:1})
}
export async function confereSenha(senha:string,valor?:string|null){
 if(!valor)return false
 if(valor.startsWith('$argon2id$')){
  try{return await verify(valor,senha)}catch{return false}
 }
 if(!senhaLegada(valor))return false
 const [salt,h]=valor.split(':')
 const key=await scrypt(senha,salt,64) as Buffer
 return timingSafeEqual(Buffer.from(h,'hex'),key)
}
