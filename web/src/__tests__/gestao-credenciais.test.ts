import {randomBytes} from 'node:crypto'
import {cifrarCredencial,decifrarCredencial} from '@/lib/gestao-licencas/credenciais'
test('protege a chave com cifra autenticada e nonce novo em cada gravação',()=>{
 const mestra=randomBytes(32),chave='chave-privada-nao-publicavel'
 const a=cifrarCredencial(chave,'sandbox',mestra),b=cifrarCredencial(chave,'sandbox',mestra)
 expect(a).not.toContain(chave);expect(a).not.toBe(b)
 expect(decifrarCredencial(a,'sandbox',mestra)).toBe(chave)
 expect(()=>decifrarCredencial(a,'production',mestra)).toThrow()
 expect(()=>decifrarCredencial(a,'sandbox',randomBytes(32))).toThrow()
 const partes=a.split('.');partes[2]=Buffer.alloc(16).toString('base64')
 expect(()=>decifrarCredencial(partes.join('.'),'sandbox',mestra)).toThrow()
})
