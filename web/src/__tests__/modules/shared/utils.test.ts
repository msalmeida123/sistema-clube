/**
 * Testes unitários para Shared Utils
 * Cobre: formatadores, validadores e helpers
 */

import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  isValidCPF,
  isValidEmail,
  isValidPhone,
  cleanDocument,
  getInitials,
  slugify,
  debounce,
  sleep,
} from '@/modules/shared/utils'

// ============================================================
// FORMATADORES
// ============================================================

describe('Shared Utils - Formatadores', () => {
  // --- formatCPF ---
  describe('formatCPF', () => {
    it('deve formatar CPF com 11 dígitos corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01')
    })

    it('deve formatar CPF removendo caracteres não numéricos antes', () => {
      expect(formatCPF('123.456.789-01')).toBe('123.456.789-01')
    })

    it('deve retornar o valor original se CPF não tem 11 dígitos', () => {
      expect(formatCPF('1234')).toBe('1234')
      expect(formatCPF('123456789012')).toBe('123456789012')
    })

    it('deve lidar com null/undefined retornando o valor original', () => {
      expect(formatCPF(null as any)).toBe(null)
      expect(formatCPF(undefined as any)).toBe(undefined)
    })

    it('deve retornar string vazia para string vazia', () => {
      expect(formatCPF('')).toBe('')
    })
  })

  // --- formatCNPJ ---
  describe('formatCNPJ', () => {
    it('deve formatar CNPJ com 14 dígitos corretamente', () => {
      expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99')
    })

    it('deve formatar CNPJ já formatado', () => {
      expect(formatCNPJ('12.345.678/0001-99')).toBe('12.345.678/0001-99')
    })

    it('deve retornar o valor original se CNPJ não tem 14 dígitos', () => {
      expect(formatCNPJ('1234567800')).toBe('1234567800')
    })

    it('deve lidar com null/undefined', () => {
      expect(formatCNPJ(null as any)).toBe(null)
      expect(formatCNPJ(undefined as any)).toBe(undefined)
    })
  })

  // --- formatPhone ---
  describe('formatPhone', () => {
    it('deve formatar celular com 11 dígitos (com 9)', () => {
      expect(formatPhone('11999887766')).toBe('(11) 99988-7766')
    })

    it('deve formatar telefone fixo com 10 dígitos', () => {
      expect(formatPhone('1133445566')).toBe('(11) 3344-5566')
    })

    it('deve formatar removendo caracteres não numéricos', () => {
      expect(formatPhone('(11) 99988-7766')).toBe('(11) 99988-7766')
    })

    it('deve retornar original se não tem 10 ou 11 dígitos', () => {
      expect(formatPhone('123')).toBe('123')
      expect(formatPhone('123456789012')).toBe('123456789012')
    })

    it('deve lidar com null/undefined', () => {
      expect(formatPhone(null as any)).toBe(null)
      expect(formatPhone(undefined as any)).toBe(undefined)
    })
  })

  // --- formatCEP ---
  describe('formatCEP', () => {
    it('deve formatar CEP com 8 dígitos corretamente', () => {
      expect(formatCEP('01310100')).toBe('01310-100')
    })

    it('deve formatar CEP já formatado', () => {
      expect(formatCEP('01310-100')).toBe('01310-100')
    })

    it('deve retornar original se não tem 8 dígitos', () => {
      expect(formatCEP('0131')).toBe('0131')
    })

    it('deve lidar com null/undefined', () => {
      expect(formatCEP(null as any)).toBe(null)
      expect(formatCEP(undefined as any)).toBe(undefined)
    })
  })

  // --- formatCurrency ---
  describe('formatCurrency', () => {
    it('deve formatar valor em reais', () => {
      const result = formatCurrency(1234.56)
      expect(result).toMatch(/R\$\s*1\.234,56/)
    })

    it('deve formatar zero', () => {
      const result = formatCurrency(0)
      expect(result).toMatch(/R\$\s*0,00/)
    })

    it('deve formatar valores negativos', () => {
      const result = formatCurrency(-99.9)
      expect(result).toMatch(/-?\s*R\$\s*99,90/)
    })

    it('deve formatar valores grandes', () => {
      const result = formatCurrency(1000000)
      expect(result).toMatch(/R\$\s*1\.000\.000,00/)
    })
  })

  // --- formatDate ---
  describe('formatDate', () => {
    it('deve formatar data ISO para formato brasileiro', () => {
      const result = formatDate('2024-12-25')
      expect(result).toBe('25/12/2024')
    })

    it('deve formatar objeto Date', () => {
      const result = formatDate(new Date(2024, 0, 15)) // Jan 15, 2024
      expect(result).toBe('15/01/2024')
    })
  })

  // --- formatDateTime ---
  describe('formatDateTime', () => {
    it('deve formatar data e hora', () => {
      const result = formatDateTime('2024-12-25T14:30:00')
      expect(result).toContain('25/12/2024')
      expect(result).toContain('14:30')
    })
  })

  // --- formatTime ---
  describe('formatTime', () => {
    it('deve formatar apenas hora e minuto', () => {
      const result = formatTime('2024-12-25T14:30:00')
      expect(result).toBe('14:30')
    })

    it('deve formatar meia-noite', () => {
      const result = formatTime('2024-12-25T00:00:00')
      expect(result).toBe('00:00')
    })
  })
})

// ============================================================
// VALIDADORES
// ============================================================

describe('Shared Utils - Validadores', () => {
  // --- isValidCPF ---
  describe('isValidCPF', () => {
    it('deve validar CPF correto', () => {
      expect(isValidCPF('529.982.247-25')).toBe(true)
      expect(isValidCPF('52998224725')).toBe(true)
    })

    it('deve rejeitar CPF com todos os dígitos iguais', () => {
      expect(isValidCPF('111.111.111-11')).toBe(false)
      expect(isValidCPF('000.000.000-00')).toBe(false)
      expect(isValidCPF('999.999.999-99')).toBe(false)
    })

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(isValidCPF('1234')).toBe(false)
      expect(isValidCPF('123456789012')).toBe(false)
      expect(isValidCPF('')).toBe(false)
    })

    it('deve rejeitar CPF com dígito verificador inválido', () => {
      expect(isValidCPF('529.982.247-26')).toBe(false)
      expect(isValidCPF('529.982.247-35')).toBe(false)
    })

    it('deve aceitar CPF com formatação', () => {
      expect(isValidCPF('529.982.247-25')).toBe(true)
    })
  })

  // --- isValidEmail ---
  describe('isValidEmail', () => {
    it('deve validar emails corretos', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('nome.sobrenome@empresa.com.br')).toBe(true)
      expect(isValidEmail('user+tag@gmail.com')).toBe(true)
    })

    it('deve rejeitar emails inválidos', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('user')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user @domain.com')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
    })
  })

  // --- isValidPhone ---
  describe('isValidPhone', () => {
    it('deve validar celular com 11 dígitos', () => {
      expect(isValidPhone('11999887766')).toBe(true)
      expect(isValidPhone('(11) 99988-7766')).toBe(true)
    })

    it('deve validar telefone fixo com 10 dígitos', () => {
      expect(isValidPhone('1133445566')).toBe(true)
      expect(isValidPhone('(11) 3344-5566')).toBe(true)
    })

    it('deve rejeitar telefones com tamanho incorreto', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('123456789012')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })
})

// ============================================================
// HELPERS
// ============================================================

describe('Shared Utils - Helpers', () => {
  // --- cleanDocument ---
  describe('cleanDocument', () => {
    it('deve remover todos os caracteres não numéricos', () => {
      expect(cleanDocument('123.456.789-01')).toBe('12345678901')
      expect(cleanDocument('12.345.678/0001-99')).toBe('12345678000199')
    })

    it('deve retornar string vazia para null/undefined', () => {
      expect(cleanDocument(null as any)).toBe('')
      expect(cleanDocument(undefined as any)).toBe('')
    })

    it('deve retornar string numérica inalterada', () => {
      expect(cleanDocument('12345')).toBe('12345')
    })
  })

  // --- getInitials ---
  describe('getInitials', () => {
    it('deve retornar as duas primeiras iniciais em maiúsculo', () => {
      expect(getInitials('Marcelo Almeida')).toBe('MA')
    })

    it('deve retornar apenas uma inicial se nome tem uma palavra', () => {
      expect(getInitials('Marcelo')).toBe('M')
    })

    it('deve limitar a 2 iniciais mesmo com nomes longos', () => {
      expect(getInitials('Marcelo da Silva Almeida')).toBe('MD')
    })

    it('deve retornar ? para null/undefined/vazio', () => {
      expect(getInitials(null as any)).toBe('?')
      expect(getInitials(undefined as any)).toBe('?')
      expect(getInitials('')).toBe('?')
    })
  })

  // --- slugify ---
  describe('slugify', () => {
    it('deve converter texto para slug', () => {
      expect(slugify('Olá Mundo')).toBe('ola-mundo')
    })

    it('deve remover acentos', () => {
      expect(slugify('Café com Açúcar')).toBe('cafe-com-acucar')
    })

    it('deve substituir espaços e caracteres especiais por hífens', () => {
      expect(slugify('Hello World! @2024')).toBe('hello-world-2024')
    })

    it('deve remover hífens do início e fim', () => {
      expect(slugify('  teste  ')).toBe('teste')
      expect(slugify('---teste---')).toBe('teste')
    })

    it('deve lidar com string vazia', () => {
      expect(slugify('')).toBe('')
    })
  })

  // --- debounce ---
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('deve atrasar a execução da função', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 300)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(300)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('deve resetar o timer a cada chamada', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 300)

      debouncedFn()
      jest.advanceTimersByTime(200)
      debouncedFn() // reseta o timer
      jest.advanceTimersByTime(200)
      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('deve passar os argumentos corretos', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')
      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('deve executar apenas a última chamada', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('a')
      debouncedFn('b')
      debouncedFn('c')
      jest.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('c')
    })
  })

  // --- sleep ---
  describe('sleep', () => {
    it('deve retornar uma Promise que resolve após o tempo', async () => {
      jest.useFakeTimers()
      const promise = sleep(1000)

      jest.advanceTimersByTime(1000)
      await promise

      jest.useRealTimers()
    })
  })
})
