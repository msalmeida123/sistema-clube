import {validarImpressoraRH} from '@/lib/rh-impressora-rede'
describe('impressora de rede do RH',()=>{
 const config={nome:'RH',ip:'192.168.1.150',porta:9100}
 it('aceita as redes privadas e as portas de impressão',()=>{
  for(const ip of ['10.0.0.15','172.16.0.15','172.31.0.15','192.168.1.150'])
   for(const porta of [515,631,9100,9109]) expect(validarImpressoraRH({...config,ip,porta})).toEqual({...config,ip,porta})
 })
 it('recusa endereços públicos, locais do servidor e nomes DNS',()=>{
  for(const ip of ['127.0.0.1','169.254.169.254','8.8.8.8','172.32.0.1','localhost','::1','192.168.1.999',''])
   expect(()=>validarImpressoraRH({...config,ip})).toThrow()
 })
 it('recusa portas de outros serviços e nomes inválidos',()=>{
  for(const porta of [22,80,5432,9000,9100.5,'9100'])expect(()=>validarImpressoraRH({...config,porta})).toThrow()
  expect(()=>validarImpressoraRH({...config,nome:''})).toThrow()
  expect(()=>validarImpressoraRH({...config,nome:'x'.repeat(101)})).toThrow()
 })
})
