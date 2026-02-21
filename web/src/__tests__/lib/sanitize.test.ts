import {
  sanitizeAttribute,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeJson,
  sanitize,
} from '@/lib/sanitize'

// ============================================
// sanitize (alias para sanitizeForHtml)
// ============================================
describe('sanitize', () => {
  it('remove HTML e escapa caracteres', () => {
    const result = sanitize('<script>alert("xss")</script>Olá')
    expect(result).not.toContain('<script>')
    expect(result).toContain('Olá')
  })

  it('retorna string vazia para null', () => {
    expect(sanitize(null)).toBe('')
  })
})

// ============================================
// sanitizeAttribute
// ============================================
describe('sanitizeAttribute', () => {
  it('escapa valor para atributo HTML', () => {
    const result = sanitizeAttribute('value"with<special>chars')
    expect(result).not.toContain('"')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('remove javascript: protocol', () => {
    const result = sanitizeAttribute('javascript:alert(1)')
    expect(result.toLowerCase()).not.toContain('javascript:')
  })

  it('remove data: protocol', () => {
    const result = sanitizeAttribute('data:text/html,<h1>XSS</h1>')
    expect(result.toLowerCase()).not.toContain('data:')
  })

  it('remove vbscript: protocol', () => {
    const result = sanitizeAttribute('vbscript:MsgBox("XSS")')
    expect(result.toLowerCase()).not.toContain('vbscript:')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(sanitizeAttribute(null)).toBe('')
    expect(sanitizeAttribute(undefined)).toBe('')
  })
})

// ============================================
// sanitizeUrl
// ============================================
describe('sanitizeUrl', () => {
  it('permite URLs https', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('permite URLs http', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('permite mailto:', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com')
  })

  it('permite tel:', () => {
    expect(sanitizeUrl('tel:+5511999887766')).toBe('tel:+5511999887766')
  })

  it('permite caminhos relativos', () => {
    expect(sanitizeUrl('/page/about')).toBe('/page/about')
  })

  it('permite âncoras', () => {
    expect(sanitizeUrl('#section')).toBe('#section')
  })

  it('bloqueia javascript:', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('bloqueia data:', () => {
    expect(sanitizeUrl('data:text/html,<h1>XSS</h1>')).toBe('')
  })

  it('bloqueia vbscript:', () => {
    expect(sanitizeUrl('vbscript:MsgBox("XSS")')).toBe('')
  })

  it('bloqueia URLs sem protocolo válido', () => {
    expect(sanitizeUrl('ftp://evil.com')).toBe('')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(sanitizeUrl(null)).toBe('')
    expect(sanitizeUrl(undefined)).toBe('')
  })
})

// ============================================
// sanitizeFilename
// ============================================
describe('sanitizeFilename', () => {
  it('mantém nomes válidos', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf')
    expect(sanitizeFilename('photo-2024.jpg')).toBe('photo-2024.jpg')
  })

  it('substitui caracteres especiais por underscore', () => {
    expect(sanitizeFilename('arquivo com espaços.txt')).toBe('arquivo_com_espa_os.txt')
  })

  it('remove múltiplos pontos consecutivos', () => {
    expect(sanitizeFilename('file...txt')).toBe('file.txt')
  })

  it('remove prefixos especiais (., _, -)', () => {
    expect(sanitizeFilename('.hidden')).toBe('hidden')
    expect(sanitizeFilename('_private')).toBe('private')
    expect(sanitizeFilename('-dash')).toBe('dash')
  })

  it('limita tamanho a 255 caracteres', () => {
    const longName = 'a'.repeat(300) + '.txt'
    const result = sanitizeFilename(longName)
    expect(result.length).toBeLessThanOrEqual(255)
  })

  it('sanitiza path traversal', () => {
    const result = sanitizeFilename('../../../etc/passwd')
    expect(result).not.toContain('/')
    expect(result).not.toContain('..')
  })
})

// ============================================
// sanitizeJson
// ============================================
describe('sanitizeJson', () => {
  it('escapa < e > para prevenir XSS em scripts', () => {
    const result = sanitizeJson({ html: '<script>alert("xss")</script>' })
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).toContain('\\u003c')
    expect(result).toContain('\\u003e')
  })

  it('escapa & e aspas simples', () => {
    const result = sanitizeJson({ text: "it's a & b" })
    expect(result).toContain('\\u0026')
    expect(result).toContain('\\u0027')
  })

  it('serializa objetos complexos', () => {
    const result = sanitizeJson({ name: 'Test', items: [1, 2, 3] })
    expect(result).toContain('Test')
    expect(result).toContain('[1,2,3]')
  })
})
