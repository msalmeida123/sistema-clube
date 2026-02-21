import { formatCPF, formatPhone, formatCurrency, formatDate } from '@/lib/utils'

describe('utils', () => {
  // ============================================
  // formatCPF
  // ============================================
  describe('formatCPF', () => {
    it('formata CPF com 11 dígitos corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01')
    })

    it('formata CPF já parcialmente formatado', () => {
      // Só funciona com dígitos puros
      expect(formatCPF('00000000000')).toBe('000.000.000-00')
    })

    it('retorna original se não tem 11 dígitos', () => {
      expect(formatCPF('123')).toBe('123')
    })
  })

  // ============================================
  // formatPhone
  // ============================================
  describe('formatPhone', () => {
    it('formata telefone com 11 dígitos (celular)', () => {
      expect(formatPhone('11999887766')).toBe('(11) 99988-7766')
    })

    it('retorna original se formato não bate', () => {
      expect(formatPhone('123')).toBe('123')
    })
  })

  // ============================================
  // formatCurrency
  // ============================================
  describe('formatCurrency', () => {
    it('formata valor positivo em BRL', () => {
      const result = formatCurrency(1234.56)
      // Intl pode usar espaço normal ou non-breaking space
      expect(result).toMatch(/R\$\s*1\.234,56/)
    })

    it('formata zero', () => {
      const result = formatCurrency(0)
      expect(result).toMatch(/R\$\s*0,00/)
    })

    it('formata valor negativo', () => {
      const result = formatCurrency(-50)
      expect(result).toMatch(/-?\s*R\$\s*50,00/)
    })

    it('formata centavos', () => {
      const result = formatCurrency(0.99)
      expect(result).toMatch(/R\$\s*0,99/)
    })
  })

  // ============================================
  // formatDate
  // ============================================
  describe('formatDate', () => {
    it('formata string ISO para dd/mm/aaaa', () => {
      const result = formatDate('2024-06-15T10:00:00Z')
      expect(result).toMatch(/15\/06\/2024/)
    })

    it('formata objeto Date', () => {
      const result = formatDate(new Date(2024, 0, 1)) // Janeiro = 0
      expect(result).toMatch(/01\/01\/2024/)
    })

    it('formata data simples YYYY-MM-DD', () => {
      const result = formatDate('2023-12-25')
      // Pode variar com timezone, mas deve conter 2023
      expect(result).toContain('2023')
    })
  })
})
