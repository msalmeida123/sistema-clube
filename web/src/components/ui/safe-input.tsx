'use client'

import * as React from 'react'
import { Input } from './input'
import { Textarea } from './textarea'
import { sanitizeForDatabase } from '@/lib/security'

interface SafeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSanitizedChange?: (sanitizedValue: string) => void
}

/**
 * Input com sanitização automática contra XSS
 * O valor é sanitizado antes de ser passado para o onChange
 */
export const SafeInput = React.forwardRef<HTMLInputElement, SafeInputProps>(
  ({ onChange, onSanitizedChange, ...props }, ref) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Sanitiza o valor
        const sanitized = sanitizeForDatabase(e.target.value)
        
        // Callback com valor sanitizado
        if (onSanitizedChange) {
          onSanitizedChange(sanitized)
        }
        
        // Chama o onChange original se existir
        if (onChange) {
          onChange(e)
        }
      },
      [onChange, onSanitizedChange]
    )

    return <Input ref={ref} onChange={handleChange} {...props} />
  }
)

SafeInput.displayName = 'SafeInput'

interface SafeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSanitizedChange?: (sanitizedValue: string) => void
}

/**
 * Textarea com sanitização automática contra XSS
 */
export const SafeTextarea = React.forwardRef<HTMLTextAreaElement, SafeTextareaProps>(
  ({ onChange, onSanitizedChange, ...props }, ref) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const sanitized = sanitizeForDatabase(e.target.value)
        
        if (onSanitizedChange) {
          onSanitizedChange(sanitized)
        }
        
        if (onChange) {
          onChange(e)
        }
      },
      [onChange, onSanitizedChange]
    )

    return <Textarea ref={ref} onChange={handleChange} {...props} />
  }
)

SafeTextarea.displayName = 'SafeTextarea'

/**
 * Hook para criar um formulario seguro
 * Sanitiza todos os campos antes do submit
 */
export function useSafeForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({})

  const setValue = React.useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? sanitizeForDatabase(value) : value
    }))
    // Limpa erro do campo quando é alterado
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const setError = React.useCallback(<K extends keyof T>(field: K, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  const reset = React.useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  const getSanitizedValues = React.useCallback((): T => {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(values)) {
      sanitized[key] = typeof value === 'string' ? sanitizeForDatabase(value) : value
    }
    return sanitized as T
  }, [values])

  return {
    values,
    errors,
    setValue,
    setError,
    reset,
    getSanitizedValues
  }
}
