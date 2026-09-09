import {codigoCarteirinha,idCarteirinha,buscaNumerica} from '@/lib/carteirinha-qr'
const id='10000000-0000-4000-8000-000000000021'
test('carteirinha usa o código cadastrado',()=>expect(codigoCarteirinha(id,'SOCIO-TESTE-990001')).toBe('SOCIO-TESTE-990001'))
test('sem código cadastrado gera identificação estável',()=>expect(idCarteirinha(codigoCarteirinha(id),'SOCIO')).toBe(id))
test('dependente tem prefixo próprio',()=>expect(idCarteirinha(codigoCarteirinha(id,null,true),'DEP')).toBe(id))
test('QR malformado não vira título',()=>{expect(buscaNumerica('abc990001xyz')).toBeNull();expect(idCarteirinha('SOCIO-990001','SOCIO')).toBeNull()})
test('título numérico preserva zeros',()=>expect(buscaNumerica('000123')).toBe('000123'))
