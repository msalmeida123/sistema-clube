import { createCipheriv, randomBytes } from 'node:crypto'
import { createSecureContext } from 'node:tls'

export function protegerCertificado(pfx: Buffer, senha: string, chave: string) {
  if (!pfx.length || pfx.length > 1024 * 1024 || senha.length > 1024) throw new Error('Arquivo ou senha fora do limite permitido.')
  try { createSecureContext({ pfx, passphrase: senha }) }
  catch { throw new Error('Não foi possível abrir o certificado. Confira a senha e use um arquivo A1 PFX/P12 compatível.') }
  if (!/^[a-f0-9]{64}$/i.test(chave)) throw new Error('A proteção do certificado ainda não foi configurada no servidor.')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(chave, 'hex'), iv)
  const dados = Buffer.concat([cipher.update(JSON.stringify({ pfx: pfx.toString('base64'), senha }), 'utf8'), cipher.final()])
  return { versao: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), dados: dados.toString('base64') }
}
