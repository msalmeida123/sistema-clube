import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto'
import {readFile} from 'node:fs/promises'

/** A chave mestra fica no Docker Secret, separada do banco e da API Asaas.
 * AES-GCM autentica o conteúdo e o ambiente: Sandbox não migra para produção. */
export async function chaveMestra(){
 const raw=(await readFile(process.env.GESTAO_CHAVE_CRIPTO||'/run/secrets/gestao_criptografia','utf8')).trim()
 if(!/^[a-f0-9]{64}$/i.test(raw))throw Error('Configuração de criptografia indisponível')
 return Buffer.from(raw,'hex')
}
export function cifrarCredencial(valor:string,ambiente:string,chave:Buffer){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',chave,iv)
 cipher.setAAD(Buffer.from('gestao:asaas:'+ambiente))
 const corpo=Buffer.concat([cipher.update(valor,'utf8'),cipher.final()])
 return ['v1',iv.toString('base64'),cipher.getAuthTag().toString('base64'),corpo.toString('base64')].join('.')
}
export function decifrarCredencial(valor:string,ambiente:string,chave:Buffer){
 const [v,iv,tag,corpo,...resto]=valor.split('.')
 if(v!=='v1'||!iv||!tag||!corpo||resto.length)throw Error('Credencial protegida inválida')
 const decipher=createDecipheriv('aes-256-gcm',chave,Buffer.from(iv,'base64'))
 decipher.setAAD(Buffer.from('gestao:asaas:'+ambiente));decipher.setAuthTag(Buffer.from(tag,'base64'))
 return Buffer.concat([decipher.update(Buffer.from(corpo,'base64')),decipher.final()]).toString('utf8')
}
