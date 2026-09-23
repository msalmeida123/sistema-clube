import { codigoCarteirinha, idCarteirinha } from '@/lib/carteirinha-qr'

const id = '12345678-1234-4234-8234-123456789abc'

test('carteirinha do dependente usa QR exclusivo com prefixo DEP', () => {
  const codigo = codigoCarteirinha(id, null, true)
  expect(codigo).toBe(`DEP-${id}`)
  expect(idCarteirinha(codigo, 'DEP')).toBe(id)
  expect(idCarteirinha(codigo, 'SOCIO')).toBeNull()
})

test('QR personalizado do dependente não se confunde com o do titular', () => {
  const titular = codigoCarteirinha(id, `SOCIO-${id}`)
  const dependente = codigoCarteirinha(id, `DEP-${id}`, true)
  expect(dependente).not.toBe(titular)
})
