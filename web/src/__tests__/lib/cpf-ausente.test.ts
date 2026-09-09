import { formatCPF } from '@/lib/utils'

describe('CPF ausente em cadastros locais', () => {
  it.each([null, undefined, ''])('exibe marcador para %s sem quebrar a pagina', (cpf) => {
    expect(formatCPF(cpf)).toBe('—')
  })
  it('preserva a formatacao de um CPF preenchido', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01')
  })
})
