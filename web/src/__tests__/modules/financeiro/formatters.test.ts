/**
 * Testes unitários para Financeiro Formatters
 * Cobre: formatCurrency, formatDate, getStatusColor
 */

import { formatCurrency, formatDate, getStatusColor } from '@/modules/financeiro/utils/formatters'

describe('Financeiro Formatters', () => {
  // ============================================================
  // formatCurrency
  // ============================================================
  describe('formatCurrency', () => {
    it('deve formatar valor positivo em BRL', () => {
      const result = formatCurrency(1500.5)
      expect(result).toMatch(/R\$\s*1\.500,50/)
    })

    it('deve formatar zero', () => {
      const result = formatCurrency(0)
      expect(result).toMatch(/R\$\s*0,00/)
    })

    it('deve formatar valor negativo', () => {
      const result = formatCurrency(-250.99)
      expect(result).toMatch(/-?\s*R\$\s*250,99/)
    })

    it('deve tratar null/undefined como 0', () => {
      const result = formatCurrency(null as any)
      expect(result).toMatch(/R\$\s*0,00/)

      const result2 = formatCurrency(undefined as any)
      expect(result2).toMatch(/R\$\s*0,00/)
    })

    it('deve formatar centavos corretamente', () => {
      const result = formatCurrency(0.01)
      expect(result).toMatch(/R\$\s*0,01/)
    })

    it('deve formatar valores grandes', () => {
      const result = formatCurrency(999999.99)
      expect(result).toMatch(/R\$\s*999\.999,99/)
    })
  })

  // ============================================================
  // formatDate
  // ============================================================
  describe('formatDate', () => {
    it('deve formatar data ISO para formato brasileiro', () => {
      expect(formatDate('2024-12-25')).toBe('25/12/2024')
    })

    it('deve formatar primeiro dia do ano', () => {
      expect(formatDate('2024-01-01')).toBe('01/01/2024')
    })

    it('deve retornar "-" para string vazia', () => {
      expect(formatDate('')).toBe('-')
    })

    it('deve retornar "-" para null/undefined', () => {
      expect(formatDate(null as any)).toBe('-')
      expect(formatDate(undefined as any)).toBe('-')
    })

    it('deve formatar data com mês fevereiro', () => {
      expect(formatDate('2024-02-29')).toBe('29/02/2024') // ano bissexto
    })
  })

  // ============================================================
  // getStatusColor
  // ============================================================
  describe('getStatusColor', () => {
    it('deve retornar cor verde para status "pago"', () => {
      expect(getStatusColor('pago')).toBe('bg-green-100 text-green-700')
    })

    it('deve retornar cor amarela para status "pendente"', () => {
      expect(getStatusColor('pendente')).toBe('bg-yellow-100 text-yellow-700')
    })

    it('deve retornar cor vermelha para status "atrasado"', () => {
      expect(getStatusColor('atrasado')).toBe('bg-red-100 text-red-700')
    })

    it('deve retornar cor cinza para status "cancelado"', () => {
      expect(getStatusColor('cancelado')).toBe('bg-gray-100 text-gray-600')
    })

    it('deve retornar cor verde para status "utilizado"', () => {
      expect(getStatusColor('utilizado')).toBe('bg-green-100 text-green-700')
    })

    it('deve retornar cor cinza padrão para status desconhecido', () => {
      expect(getStatusColor('inexistente')).toBe('bg-gray-100 text-gray-600')
      expect(getStatusColor('')).toBe('bg-gray-100 text-gray-600')
    })
  })
})
