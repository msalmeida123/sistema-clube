import {hashSenha,confereSenha,senhaLegada} from '../lib/senhas-associado'
import {scryptSync} from 'node:crypto'
describe('Senhas do associado',()=>{
 test('Argon2id verifica a senha e usa salt independente',async()=>{
  const a=await hashSenha('Senha de teste ç 123'),b=await hashSenha('Senha de teste ç 123')
  expect(a).toMatch(/^\$argon2id\$/);expect(a).not.toBe(b)
  expect(await confereSenha('Senha de teste ç 123',a)).toBe(true)
  expect(await confereSenha('incorreta',a)).toBe(false)
  expect(senhaLegada(a)).toBe(false)
 })
 test('Preserva scrypt antigo para migração',async()=>{
  const salt='a'.repeat(32),senha='Senha antiga ç 123'
  const antigo=salt+':'+scryptSync(senha,salt,64).toString('hex')
  expect(senhaLegada(antigo)).toBe(true)
  expect(await confereSenha(senha,antigo)).toBe(true)
  expect(await confereSenha('incorreta',antigo)).toBe(false)
 })
 test.each([null,'','abc:def','$argon2id$invalido'])('Rejeita hash inválido %s',async valor=>{
  expect(await confereSenha('senha',valor)).toBe(false)
 })
})
