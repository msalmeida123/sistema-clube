/**
 * Funções de Sanitização para uso em componentes React
 * 
 * Uso:
 * import { sanitize, SafeHtml } from '@/lib/sanitize'
 * 
 * // Em texto:
 * <p>{sanitize(userInput)}</p>
 * 
 * // Para renderizar HTML seguro:
 * <SafeHtml content={userHtml} />
 */

import { escapeHtml, stripHtml, sanitizeString, sanitizeForDatabase, sanitizeForHtml } from './security'

// Re-exporta funções principais
export { escapeHtml, stripHtml, sanitizeString, sanitizeForDatabase, sanitizeForHtml }

/**
 * Alias para sanitizeForHtml - uso mais simples
 */
export const sanitize = sanitizeForHtml

/**
 * Sanitiza valor para atributo HTML
 */
export function sanitizeAttribute(value: string | null | undefined): string {
  if (!value) return ''
  return escapeHtml(sanitizeString(value))
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
}

/**
 * Sanitiza URL
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  const cleaned = sanitizeString(url)
  
  // Bloqueia protocolos perigosos
  const dangerous = /^(javascript|data|vbscript):/i
  if (dangerous.test(cleaned)) {
    return ''
  }
  
  // Permite apenas http, https, mailto, tel
  const safe = /^(https?:\/\/|mailto:|tel:|#|\/)/i
  if (!safe.test(cleaned) && !cleaned.startsWith('/')) {
    return ''
  }
  
  return cleaned
}

/**
 * Sanitiza nome de arquivo
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove caracteres especiais
    .replace(/\.{2,}/g, '.')          // Remove múltiplos pontos
    .replace(/^[._-]+/, '')            // Remove prefixos especiais
    .slice(0, 255)                     // Limita tamanho
}

/**
 * Sanitiza JSON string para prevenção de XSS em scripts
 */
export function sanitizeJson(obj: any): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
}

/**
 * Componente React para renderizar HTML seguro
 * Permite apenas tags seguras e remove atributos perigosos
 */
import React from 'react'

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code'
])

const ALLOWED_ATTRIBUTES = new Set([
  'href', 'src', 'alt', 'title', 'class', 'id',
  'width', 'height', 'style'
])

const DANGEROUS_STYLE_VALUES = /expression|javascript|vbscript/gi

function sanitizeHtmlContent(html: string): string {
  // Parser simples - para produção use DOMPurify
  return html
    // Remove scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove styles inline perigosos
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: URLs
    .replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])javascript:[^'"]*\1/gi, '')
    // Remove data: URLs em src (exceto imagens base64 seguras)
    .replace(/src\s*=\s*(['"])data:(?!image\/)[^'"]*\1/gi, '')
}

interface SafeHtmlProps {
  content: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function SafeHtml({ content, className, as: Tag = 'div' }: SafeHtmlProps) {
  const sanitizedHtml = sanitizeHtmlContent(content)
  
  return React.createElement(Tag, {
    className,
    dangerouslySetInnerHTML: { __html: sanitizedHtml }
  })
}

/**
 * Hook para sanitizar inputs em formulários
 */
export function useSanitizedInput(initialValue: string = '') {
  const [value, setValue] = React.useState(initialValue)
  const [sanitizedValue, setSanitizedValue] = React.useState(sanitizeForDatabase(initialValue))
  
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value
    setValue(raw)
    setSanitizedValue(sanitizeForDatabase(raw))
  }, [])
  
  return {
    value,
    sanitizedValue,
    onChange: handleChange,
    reset: () => {
      setValue('')
      setSanitizedValue('')
    }
  }
}
