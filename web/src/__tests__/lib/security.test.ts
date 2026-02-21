import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeForHtml,
  sanitizeForDatabase,
  sanitizeObject,
  isValidEmail,
  validatePassword,
  isValidPhone,
  isValidCPF,
  isValidCNPJ,
  maskSensitiveData,
  checkRateLimit,
  clearRateLimit,
} from '@/lib/security'

// ============================================
// Sanitização XSS
// ============================================
describe('escapeHtml', () => {
  it('escapa tags HTML', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).not.toContain('<script>')
    expect(escapeHtml('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;')
  })

  it('escapa aspas e caracteres especiais', () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#x27;world&#x27;')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('retorna string vazia para string vazia', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('não altera texto puro sem caracteres especiais', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })
})

describe('stripHtml', () => {
  it('remove tags HTML simples', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello')
  })

  it('remove tags script com conteúdo', () => {
    expect(stripHtml('before<script>alert("xss")</script>after')).toBe('beforeafter')
  })

  it('remove tags style com conteúdo', () => {
    expect(stripHtml('text<style>body{color:red}</style>more')).toBe('textmore')
  })

  it('converte &nbsp; para espaço', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(stripHtml(null)).toBe('')
    expect(stripHtml(undefined)).toBe('')
  })

  it('remove tags aninhadas', () => {
    expect(stripHtml('<div><p><strong>text</strong></p></div>')).toBe('text')
  })
})

describe('sanitizeString', () => {
  it('remove caracteres de controle', () => {
    expect(sanitizeString('hello\x00world')).toBe('hello world')
    expect(sanitizeString('test\x0Bvalue')).toBe('test value')
  })

  it('normaliza múltiplos espaços', () => {
    expect(sanitizeString('hello    world')).toBe('hello world')
  })

  it('faz trim', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })
})

describe('sanitizeForHtml', () => {
  it('combina strip + sanitize + escape', () => {
    const input = '<b>Hello</b> <script>alert("xss")</script> World'
    const result = sanitizeForHtml(input)
    expect(result).not.toContain('<')
    expect(result).not.toContain('script')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })
})

describe('sanitizeForDatabase', () => {
  it('remove HTML e caracteres de controle', () => {
    const result = sanitizeForDatabase('<p>Hello\x00</p>')
    expect(result).toBe('Hello')
  })

  it('preserva texto normal', () => {
    expect(sanitizeForDatabase('Texto normal com acentuação')).toBe('Texto normal com acentuação')
  })
})

describe('sanitizeObject', () => {
  it('sanitiza strings em objeto simples', () => {
    const result = sanitizeObject({ name: '<b>Test</b>', age: 25 })
    expect(result.name).toBe('Test')
    expect(result.age).toBe(25)
  })

  it('sanitiza strings em arrays', () => {
    const result = sanitizeObject({ tags: ['<b>tag1</b>', 'tag2'] })
    expect(result.tags).toEqual(['tag1', 'tag2'])
  })

  it('sanitiza objetos aninhados', () => {
    const result = sanitizeObject({ user: { name: '<script>x</script>John' } })
    expect(result.user.name).toBe('John')
  })

  it('preserva null e undefined', () => {
    const result = sanitizeObject({ a: null, b: undefined })
    expect(result.a).toBeNull()
    expect(result.b).toBeUndefined()
  })

  it('preserva números e booleans', () => {
    const result = sanitizeObject({ count: 42, active: true })
    expect(result.count).toBe(42)
    expect(result.active).toBe(true)
  })
})

// ============================================
// Validação
// ============================================
describe('isValidEmail', () => {
  it('aceita emails válidos', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('test.user@domain.co')).toBe(true)
    expect(isValidEmail('user+tag@gmail.com')).toBe(true)
  })

  it('rejeita emails inválidos', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user @domain.com')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('rejeita senha curta (< 6 chars)', () => {
    const result = validatePassword('abc')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('aceita senha com 6+ caracteres', () => {
    const result = validatePassword('abcdef')
    expect(result.valid).toBe(true)
  })

  it('detecta padrões comuns como "123456"', () => {
    const result = validatePassword('123456abc')
    expect(result.errors).toContain('Senha contém padrão muito comum')
  })

  it('detecta padrão "senha"', () => {
    const result = validatePassword('minhasenha123')
    expect(result.errors).toContain('Senha contém padrão muito comum')
  })

  it('classifica força: fraca', () => {
    const result = validatePassword('abcdef')
    expect(result.strength).toBe('fraca')
  })

  it('classifica força: media', () => {
    const result = validatePassword('Abcdef12')
    expect(result.strength).toBe('media')
  })

  it('classifica força: forte', () => {
    const result = validatePassword('Abc@12345678!')
    expect(result.strength).toBe('forte')
  })
})

describe('isValidPhone', () => {
  it('aceita telefone fixo (10 dígitos)', () => {
    expect(isValidPhone('1133334444')).toBe(true)
  })

  it('aceita celular (11 dígitos)', () => {
    expect(isValidPhone('11999887766')).toBe(true)
  })

  it('aceita com formatação', () => {
    expect(isValidPhone('(11) 99988-7766')).toBe(true)
  })

  it('rejeita números curtos', () => {
    expect(isValidPhone('123')).toBe(false)
  })

  it('rejeita números longos', () => {
    expect(isValidPhone('123456789012')).toBe(false)
  })
})

describe('isValidCPF', () => {
  // CPFs válidos conhecidos para teste
  it('aceita CPF válido', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true)
    expect(isValidCPF('52998224725')).toBe(true)
  })

  it('rejeita CPF com todos dígitos iguais', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false)
    expect(isValidCPF('000.000.000-00')).toBe(false)
  })

  it('rejeita CPF com tamanho errado', () => {
    expect(isValidCPF('123')).toBe(false)
    expect(isValidCPF('1234567890123')).toBe(false)
  })

  it('rejeita CPF com dígito verificador inválido', () => {
    expect(isValidCPF('529.982.247-99')).toBe(false)
    expect(isValidCPF('123.456.789-00')).toBe(false)
  })
})

describe('isValidCNPJ', () => {
  it('aceita CNPJ válido', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true)
    expect(isValidCNPJ('11222333000181')).toBe(true)
  })

  it('rejeita CNPJ com todos dígitos iguais', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false)
  })

  it('rejeita CNPJ com tamanho errado', () => {
    expect(isValidCNPJ('123')).toBe(false)
  })

  it('rejeita CNPJ com dígito verificador inválido', () => {
    expect(isValidCNPJ('11.222.333/0001-99')).toBe(false)
  })
})

// ============================================
// Utilitários
// ============================================
describe('maskSensitiveData', () => {
  it('mascara email', () => {
    const result = maskSensitiveData('user@example.com', 'email')
    expect(result).toBe('u***@e***.com')
    expect(result).not.toContain('user')
    expect(result).not.toContain('example')
  })

  it('mascara telefone', () => {
    const result = maskSensitiveData('11999887766', 'phone')
    expect(result).toBe('11*****66')
    expect(result).not.toContain('99988')
  })

  it('mascara CPF', () => {
    const result = maskSensitiveData('123.456.789-01', 'cpf')
    expect(result).toBe('123.***.**01')
    expect(result).not.toContain('456')
  })

  it('retorna vazio para dados vazios', () => {
    expect(maskSensitiveData('', 'email')).toBe('')
  })
})

describe('checkRateLimit / clearRateLimit', () => {
  beforeEach(() => {
    clearRateLimit('test-key')
  })

  it('permite requisições dentro do limite', () => {
    expect(checkRateLimit('test-key', 3, 60000)).toBe(false)
    expect(checkRateLimit('test-key', 3, 60000)).toBe(false)
    expect(checkRateLimit('test-key', 3, 60000)).toBe(false)
  })

  it('bloqueia quando excede o limite', () => {
    checkRateLimit('test-key-2', 2, 60000)
    checkRateLimit('test-key-2', 2, 60000)
    expect(checkRateLimit('test-key-2', 2, 60000)).toBe(true)
    clearRateLimit('test-key-2')
  })

  it('clearRateLimit libera o bloqueio', () => {
    checkRateLimit('test-key-3', 1, 60000)
    expect(checkRateLimit('test-key-3', 1, 60000)).toBe(true) // bloqueado
    clearRateLimit('test-key-3')
    expect(checkRateLimit('test-key-3', 1, 60000)).toBe(false) // liberado
    clearRateLimit('test-key-3')
  })

  it('chaves diferentes são independentes', () => {
    checkRateLimit('key-a', 1, 60000)
    expect(checkRateLimit('key-a', 1, 60000)).toBe(true) // bloqueado
    expect(checkRateLimit('key-b', 1, 60000)).toBe(false) // outra chave, ok
    clearRateLimit('key-a')
    clearRateLimit('key-b')
  })
})
