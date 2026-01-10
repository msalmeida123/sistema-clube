/**
 * Biblioteca de Segurança - Sanitização XSS e Validação
 * 
 * IMPORTANTE: O Supabase Auth já faz hash das senhas automaticamente usando bcrypt.
 * Não é necessário fazer hash manual das senhas.
 * 
 * Esta biblioteca fornece:
 * - Sanitização de HTML para prevenir XSS
 * - Validação de inputs
 * - Funções utilitárias de segurança
 */

// ===== SANITIZAÇÃO XSS =====

/**
 * Mapa de caracteres HTML perigosos para suas entidades
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

/**
 * Escapa caracteres HTML perigosos para prevenir XSS
 * Use esta função quando precisar exibir conteúdo de usuário em HTML
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str).replace(/[&<>"'`=\/]/g, char => HTML_ENTITIES[char] || char)
}

/**
 * Remove todas as tags HTML de uma string
 * Mantém apenas o texto puro
 */
export function stripHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
    .replace(/<[^>]+>/g, '')                                           // Remove outras tags
    .replace(/&nbsp;/g, ' ')                                           // Converte nbsp
    .trim()
}

/**
 * Sanitiza string removendo caracteres de controle e normaliza espaços
 */
export function sanitizeString(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
    .replace(/\s+/g, ' ')                              // Normaliza espaços
    .trim()
}

/**
 * Sanitiza conteúdo para uso seguro em HTML
 * Combina stripHtml + sanitizeString + escapeHtml
 */
export function sanitizeForHtml(str: string | null | undefined): string {
  return escapeHtml(sanitizeString(stripHtml(str)))
}

/**
 * Sanitiza conteúdo para armazenamento no banco
 * Remove HTML e caracteres de controle, mantém texto limpo
 */
export function sanitizeForDatabase(str: string | null | undefined): string {
  return sanitizeString(stripHtml(str))
}

/**
 * Sanitiza objeto recursivamente
 * Útil para sanitizar payloads de API inteiros
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeForDatabase(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeForDatabase(item) : 
        typeof item === 'object' ? sanitizeObject(item) : item
      )
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}

// ===== VALIDAÇÃO =====

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida força da senha
 * Retorna objeto com resultado e mensagens de erro
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
  strength: 'fraca' | 'media' | 'forte'
} {
  const errors: string[] = []
  let score = 0

  if (password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres')
  } else {
    score++
  }

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  // Verifica padrões comuns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111', 'senha']
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    errors.push('Senha contém padrão muito comum')
    score = Math.max(0, score - 2)
  }

  const strength = score < 3 ? 'fraca' : score < 5 ? 'media' : 'forte'

  return {
    valid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false // Todos dígitos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false

  return true
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  const calcDigit = (base: string, weights: number[]): number => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(base.charAt(i)) * weights[i]
    }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const digit1 = calcDigit(cleaned.slice(0, 12), weights1)
  const digit2 = calcDigit(cleaned.slice(0, 12) + digit1, weights2)

  return cleaned.endsWith(`${digit1}${digit2}`)
}

// ===== UTILITÁRIOS =====

/**
 * Mascara dados sensíveis para logs
 * Ex: email@test.com -> e***@t***.com
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'cpf'): string {
  if (!data) return ''
  
  switch (type) {
    case 'email': {
      const [local, domain] = data.split('@')
      if (!domain) return '***'
      const [name, ext] = domain.split('.')
      return `${local[0]}***@${name[0]}***.${ext}`
    }
    case 'phone': {
      const cleaned = data.replace(/\D/g, '')
      return `${cleaned.slice(0, 2)}*****${cleaned.slice(-2)}`
    }
    case 'cpf': {
      const cleaned = data.replace(/\D/g, '')
      return `${cleaned.slice(0, 3)}.***.**${cleaned.slice(-2)}`
    }
    default:
      return '***'
  }
}

/**
 * Gera token aleatório seguro
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint32Array(length)
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues)
  } else {
    // Fallback para Node.js
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * chars.length)
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  
  return result
}

/**
 * Rate limiting simples para cliente
 * Retorna true se deve bloquear a requisição
 */
const rateLimitMap = new Map<string, number[]>()

export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(key) || []
  
  // Remove timestamps antigos
  const validTimestamps = timestamps.filter(t => now - t < windowMs)
  
  if (validTimestamps.length >= maxRequests) {
    return true // Deve bloquear
  }
  
  validTimestamps.push(now)
  rateLimitMap.set(key, validTimestamps)
  
  return false // Pode prosseguir
}

/**
 * Limpa o rate limit para uma chave
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key)
}
